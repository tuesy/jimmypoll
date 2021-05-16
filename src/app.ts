import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as Utils from "./utils";

const fetch = require('node-fetch');
const url = require('url')
const WELCOME_TEXT = 'Poll App';
const INFO_TEXT_HEIGHT = 1.6;
const MAX_CHOICES = 6;
const CHOICE_SPACING = 0.2;
const SCREEN_HEIGHT = 1.5;
const APP_TITLE_HEIGHT = 0.4;
const START_POLL_HEIGHT = 0.2;
const UPDATE_POLL_HEIGHT = 0.3;
const CONTROLS_SCALE = {x: 0.2, y: 0.2, z: 0.2};
const CONTROLS_POSITION = {
  x: 0.1, // move it left to accomodate long choice names
  y: -0.05, // move it out of the hand, toward you
  z: 0.1 // move it up to allow everything to be super sized
}

const FONT = MRE.TextFontFamily.Cursive;

const HELP_BUTTON_POSITION = { x: 1.74, y: 0.6, z: 0 }; // bottom right corner of the screen
const HELP_BUTTON_TEXT = `Take a poll!

When a poll starts you'll hear a sound and see choices on your left wrist.

You can vote by clicking or touching the button next to your choice. You may change your vote as often as you'd like.

Once the first vote is in, results will update on the screen live.`;
const POLL_BUTTON_POSITION = { x: HELP_BUTTON_POSITION.x - 0.34, y: HELP_BUTTON_POSITION.y, z: HELP_BUTTON_POSITION.z }; // to the left of the help button
const POLL_BUTTON_TEXT = `Enter a question and click "OK" to start a new poll.

Learn more at github.com/tuesy/poll`;

const DEBUG = false;

type PollDescriptor = {
  name: string,
  choices: PollChoiceDescriptor[];
};

type PollChoiceDescriptor = {
  name: string,
  userIds: Set<string>
}

export default class Poll {
	private assets: MRE.AssetContainer;
  private attachedWatches = new Map<MRE.Guid, MRE.Actor>();
  private libraryActors: MRE.Actor[] = [];
  private infoText : any;
  private polls: { [key: string]: PollDescriptor } = {};
  private backgroundImage : string;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet) {
		this.context.onStarted(() => this.started());
    this.context.onUserLeft(user => this.userLeft(user));
    this.context.onUserJoined(user => this.userJoined(user));
	}

	private async started() {
    this.assets = new MRE.AssetContainer(this.context);
    this.backgroundImage = Utils.chooseBackgroundImage(this.params);
    this.createInterface();
	}

  private startPoll(pollId: string, input: string){
    let inputs = input.split('|');
    let pollName = inputs.slice(0,1)[0].trim();
    let choiceNames = inputs.slice(1,MAX_CHOICES+1);

    if(DEBUG){
      console.log(`inputs: ${inputs}, pollName: ${pollName}, choiceNames: ${choiceNames}`);
    }

    pollName = pollName.trim().charAt(0).toUpperCase() + pollName.slice(1); // capitalize first letter
    if(pollName.charAt(pollName.length-1) != '?') // stick a question at the end
      pollName += '?';

    this.infoText.transform.local.position.x = 0;
    this.infoText.text.height = START_POLL_HEIGHT;
    this.infoText.text.anchor = MRE.TextAnchorLocation.MiddleCenter;
    this.infoText.text.justify = MRE.TextJustify.Center;
    this.infoText.text.contents = `Poll: ${pollName}`;

    // overrides exxisting polls
    this.polls[pollId] = {
      name: pollName,
      choices: []
    };

    // by default, it's Yes or No
    if(choiceNames.length < 2){
      this.polls[pollId].choices.push({
        name: 'Yes',
        userIds: new Set<string>()
      });

      this.polls[pollId].choices.push({
        name: 'No',
        userIds: new Set<string>()
      });
    }
    else{
      // setup choices by name and index
      for (let i = 0; i < choiceNames.length; i++){
        let x = choiceNames[i].trim();
        x = x.trim().charAt(0).toUpperCase() + x.slice(1);
        this.polls[pollId].choices.push({
          name: x, // capitalize first letter
          userIds: new Set<string>()
        });
      }
    }

    this.infoText.text.height = START_POLL_HEIGHT;

    // recreate everyone's controls
    for (let i = 0; i < this.context.users.length; i++){
      let user = this.context.users[i];
      this.removeControls(user.id);
      this.wearControls(user.id);
    }

    // play a sound for everyone to let people know a new poll started
    const musicAsset = this.assets.createSound('startPollSound', { uri: 'start.ogg' } );
    const musicSoundInstance = this.infoText.startSound(musicAsset.id, {
        volume: 0.2,
        looping: false,
        doppler: 0.0,
        spread: 0.7,
        rolloffStartDistance: 2.5
    });

    if(DEBUG){
      console.log(`[Poll][Start] "${pollName}" (${pollId})`);
      console.log(this.polls[pollId]);
    }
  }

  private takePoll(user: MRE.User, response: number){
    let userId = String(user.id);
    let pollId = this.pollIdFor(user);

    // update poll database
    if(DEBUG)
      console.log(`[Poll][Taking] ${pollId} - ${user.id} - ${response}`);

    if(pollId in this.polls){
      let poll = this.polls[pollId];
      // remove from
      for (let i = 0; i < poll.choices.length; i++) {
        if(i == response)
          poll.choices[i].userIds.add(userId);
        else
          poll.choices[i].userIds.delete(userId);
      }
      this.updatePoll(pollId);
    }
  }

  private updatePoll(pollId: string){
    let poll = this.polls[pollId];
    if(poll){
      let totalVotes = poll.choices.reduce((sum, current) => sum + current.userIds.size, 0);
      let display = `Poll: ${poll.name}\n`;
      for(let i = 0; i < poll.choices.length; i++){
        let votes = poll.choices[i].userIds.size;
        let percentage = Math.round(votes / totalVotes * 100);
        display += `${percentage}%  ${poll.choices[i].name} (${votes})\n`;
      }

      this.infoText.transform.local.position.x = -1;
      this.infoText.text.height = UPDATE_POLL_HEIGHT;
      this.infoText.text.anchor = MRE.TextAnchorLocation.MiddleLeft;
      this.infoText.text.justify = MRE.TextJustify.Left;
      this.infoText.text.contents = display;

      // make it smaller so we can see all the results
      if(poll.choices.length > 3){
        this.infoText.text.height = 0.2;
        this.infoText.transform.local.position.x = -1.5;
      }
      else{
        this.infoText.text.height = 0.3;
        this.infoText.transform.local.position.x = -1.5;
      }
    }
  }

  // could be from an Event or a World
  private pollIdFor(user: MRE.User) : string{
    let pollId = null;
    if(user.properties['altspacevr-event-id']){
      pollId = user.properties['altspacevr-event-id'];
    }
    else{
      pollId = user.properties['altspacevr-space-id'];
    }
    return pollId;
  }

  private createInterface(){
    // theater screen
    let screenScale = 0.5;
    const screen = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1338743673998803669', // https://account.altvr.com/kits/1329955493782749272/artifacts/1338743673998803669
      actor: {
        name: 'Theater Screen',
        transform: { local: { position: { x: 0, y: SCREEN_HEIGHT, z: 0.1 }, scale: {x: screenScale, y: screenScale, z: 1} } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
      }
     });

    // add some background pattern
    if(DEBUG)
      console.log(`Background: ${this.backgroundImage}`);

    const backgroundMaterial = this.assets.createMaterial("bgMat", {
      mainTextureId: this.assets.createTexture("bgTex", { uri: this.backgroundImage } ).id,
      mainTextureScale: {x: 4, y: 2} // sets how often the pattern repeats--bigger is more tiles. Tiles are square but screen is ~2:1
    });
    const background = MRE.Actor.Create(this.context, {
      actor: {
        transform: { local: { position: { x: 0, y: 0, z: -0.02 } } }, // -Z is towards you when looking at the screen
        appearance: {
            meshId: this.assets.createBoxMesh("cube", 7.8, 4.38, 0.02).id, // X is width, Y is height, Z is depth when looking at screen
            materialId: backgroundMaterial.id
        },
        parentId: screen.id
      }
    });


    this.infoText = MRE.Actor.Create(this.context, {
      actor: {
        name: 'Info Text',
        transform: { local: { position: { x: 0, y: INFO_TEXT_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        text: {
          contents: WELCOME_TEXT,
          height: APP_TITLE_HEIGHT,
          anchor: MRE.TextAnchorLocation.MiddleCenter,
          justify: MRE.TextJustify.Center,
          font: FONT
        }
      }
    });

    const helpButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579238405710021245',
      actor: {
        name: 'Help Button',
        transform: { local: { position: HELP_BUTTON_POSITION } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
      }
     });
    helpButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      user.prompt(HELP_BUTTON_TEXT).then(res => {
          if(res.submitted){
            // clicked 'OK'
          }
          else{
            // clicked 'Cancel'
          }
      })
      .catch(err => {
        console.error(err);
      });
    });
  }

  // handles when user has no roles
  private canManagePolls(user: MRE.User) : boolean{
    let roles = user.properties['altspacevr-roles'].split(',');
    return roles && (roles.includes('moderator') || roles.includes('terraformer') || roles.includes('host'))
  }

  private wearControls(userId: MRE.Guid) {
    if(DEBUG)
      console.log(`User ${userId} attempting to wear consoles, poll: ${this.pollIdFor(this.context.user(userId))}`);

    let poll = this.polls[this.pollIdFor(this.context.user(userId))];
    // don't do anything if there's no active poll
    if(!poll){
      return;
    }

    this.removeControls(userId);

    const rotation = { x: 90, y: 0, z: 0 }
    const attachPoint = <MRE.AttachPoint> 'left-hand';

    // main object, the Watch
    const watch = MRE.Actor.Create(this.context, {
      actor: {
          transform: {
              local: {
                  position: CONTROLS_POSITION,
                  rotation: MRE.Quaternion.FromEulerAngles(
                      rotation.x * MRE.DegreesToRadians,
                      rotation.y * MRE.DegreesToRadians,
                      rotation.z * MRE.DegreesToRadians),
                  scale: CONTROLS_SCALE
              }
          },
          attachment: {
              attachPoint: attachPoint,
              userId
          },
          exclusiveToUser: userId
      }
    })

    let y = -0.2;
    const buttonSpacing = 0.3;

    // title
    const label = MRE.Actor.Create(this.context, {
      actor: {
        transform: { local: { position: { x: 0, y: 0, z: 0 }, rotation: MRE.Quaternion.FromEulerAngles(
                      0 * MRE.DegreesToRadians,
                      180 * MRE.DegreesToRadians,
                      0 * MRE.DegreesToRadians) } },
        text: {
          contents: `Poll: ${poll.name}`,
          height: 0.2,
          anchor: MRE.TextAnchorLocation.MiddleLeft,
          justify: MRE.TextJustify.Left,
          font: FONT
        },
        parentId: watch.id
      }
    });

    y -= buttonSpacing / 2;

    for (let i = 0; i < poll.choices.length; i++){
      // add buttons
      const button = MRE.Actor.CreateFromLibrary(this.context, {
        resourceId: 'artifact:1579239603192201565', // https://account.altvr.com/kits/1579230775574790691/artifacts/1579239603192201565
        actor: {
          transform: { local: { position: { x: 0, y: y, z: 0 }, rotation: MRE.Quaternion.FromEulerAngles(
                      0 * MRE.DegreesToRadians,
                      180 * MRE.DegreesToRadians,
                      0 * MRE.DegreesToRadians) } },
          collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
          parentId: watch.id
        }
      });

      // on click
      button.setBehavior(MRE.ButtonBehavior).onClick(user => {
        this.takePoll(user, i);

        // play a sound for the user to give feedback since most people don't have haptic feedback enabled (to save battery)
        // attach this to the watch so it's exclusive to the user
        const musicAsset = this.assets.createSound('clickSound', { uri: 'click.ogg' } );
        const musicSoundInstance = watch.startSound(musicAsset.id, {
            volume: 0.1,
            looping: false,
            doppler: 0.0,
            spread: 0.7,
            rolloffStartDistance: 2.5
        });

      });
      const label = MRE.Actor.Create(this.context, {
        actor: {
          transform: { local: { position: { x: CHOICE_SPACING, y: 0, z: 0 } } },
          text: {
            contents: poll.choices[i].name,
            height: 0.2,
            anchor: MRE.TextAnchorLocation.MiddleLeft,
            justify: MRE.TextJustify.Left,
            font: FONT
          },
          parentId: button.id
        }
      });

      y -= buttonSpacing;
    }

    this.attachedWatches.set(userId, watch);
  }

  private userLeft(user: MRE.User) {
    this.removeControls(user.id);
  }

  private removeControls(userId: MRE.Guid){
    // If the user was wearing a watch, destroy it. Otherwise it would be
    // orphaned in the world.
    if (this.attachedWatches.has(userId)) { this.attachedWatches.get(userId).destroy(); }
    this.attachedWatches.delete(userId);
  }

  private userJoined(user: MRE.User) {
    if(DEBUG){
      console.log("User has joined:");
      console.log(user.properties);
    }

    if(this.canManagePolls(user))
      this.createPollButtonFor(user);

    this.wearControls(user.id);
  }

  private createPollButtonFor(user: MRE.User){
    const pollButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579239603192201565', // https://account.altvr.com/kits/1579230775574790691/artifacts/1579239603192201565
      actor: {
        name: 'Poll Button',
        transform: { local: { position: POLL_BUTTON_POSITION } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        exclusiveToUser: user.id
      }
    });
    pollButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      user.prompt(POLL_BUTTON_TEXT, true)
      .then(res => {
        if(res.submitted && res.text.length > 0){
          this.startPoll(this.pollIdFor(user), res.text);
        }
        else{
          // user clicked 'Cancel'
        }
      })
      .catch(err => {
        console.error(err);
      });
    });
  }
}