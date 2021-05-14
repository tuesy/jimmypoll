import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const fetch = require('node-fetch');
const url = require('url')
const WELCOME_TEXT = 'Poll App';
const INFO_TEXT_HEIGHT = 1.6;
const BUTTON_HEIGHT = 0.18;
const MAX_CHOICES = 6;
const CHOICE_SPACING = 0.2;
const SCREEN_HEIGHT = 1.5;
const BACKGROUND_IMAGES = ["tile01.png", "tile02.png", "tile03.png", "tile04.png", "tile05.png", "tile06.png", "tile07.png", "tile08.png", "tile09.png"];

// if you're looking at your left palm, this is how much to it's coming towards you
// the more negative it is, the farther away from the wrist it'll be
const WRIST_OFFSET = -0.05;

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
  private screenBackgroundImage = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]; // randomly choose one by default


	constructor(private context: MRE.Context, private params: MRE.ParameterSet) {
		this.context.onStarted(() => this.started());
    this.context.onUserLeft(user => this.userLeft(user));
    this.context.onUserJoined(user => this.userJoined(user));
	}

	private async started() {
		this.assets = new MRE.AssetContainer(this.context);
    this.createInterface();

    // hosts can choose a background
    if(this.params.bg){
      let index = Number(this.params.bg);
      let total = BACKGROUND_IMAGES.length;
      if(index > 0 && index < total)
        this.screenBackgroundImage = BACKGROUND_IMAGES[index-1];
    }

    if(DEBUG){
      // this.startPoll('806780906349003424', 'default yes no poll');
      //this.startPoll('806780906349003424', '3-choice poll|one|two|three');
      //this.startPoll('806780906349003424', '4-choice poll|one|two|three|four');
    }
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

    this.infoText.text.height = 0.2;

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
      let display = `${poll.name}\n`;
      for(let i = 0; i < poll.choices.length; i++){
        display += `${poll.choices[i].name}: ${poll.choices[i].userIds.size}\n`;
      }
      this.infoText.text.contents = display;

      // make it smaller so we can see all the results
      if(poll.choices.length > 3){
        this.infoText.text.height = 0.1;
      }
      else{
        this.infoText.text.height = 0.2;
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
    const backgroundMaterial = this.assets.createMaterial("bgMat", {
      mainTextureId: this.assets.createTexture("bgTex", { uri: this.screenBackgroundImage } ).id,
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
          height: 0.2,
          anchor: MRE.TextAnchorLocation.MiddleCenter,
          justify: MRE.TextJustify.Center,
          font: MRE.TextFontFamily.Cursive
        }
      }
    });

    const helpButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579238405710021245',
      actor: {
        name: 'Help Button',
        transform: { local: { position: { x: 0.2, y: BUTTON_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
      }
     });
    helpButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      user.prompt(`Take a quick poll!

Moderators can click the orange button to start a poll and everyone else can click to take the poll. You can change your response at any time.

The controls will be on your left hand and you can either touch or click the buttons.

Only one poll per Event or World and Events with multiple rooms will be part of a single poll. Starting a new poll clears the last one.

Click "OK" for an example.
 `).then(res => {
          if(res.submitted){
            // clicked 'OK'
            this.startPoll(this.pollIdFor(user), 'what platform are you on|Oculus Quest|PC|Mac|Hololens|Other');
            this.wearControls(user.id);
          }
          else{
            // clicked 'Cancel'
          }
      })
      .catch(err => {
        console.error(err);
      });
    });

    const pollButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579239603192201565', // https://account.altvr.com/kits/1579230775574790691/artifacts/1579239603192201565
      actor: {
        name: 'Poll Button',
        transform: { local: { position: { x: -0.2, y: BUTTON_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
      }
    });
    pollButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      if(this.canManagePolls(user)){
        user.prompt(`Enter a question and click "OK"
(e.g. "got milk" => "Got Milk?"")

By default, users can choose "Yes" or "No". You can customize the choices (up to ${MAX_CHOICES}) by adding them after the question separated by "|".
(e.g. "favorite color|blue|red|yellow")`, true)
        .then(res => {
          if(res.submitted && res.text.length > 0){
            this.startPoll(this.pollIdFor(user), res.text);
            this.wearControls(user.id);
          }
          else{
            // user clicked 'Cancel'
          }
        })
        .catch(err => {
          console.error(err);
        });
      }
      else{
        // everybody gets the controls so they can vote
        this.wearControls(user.id);
      }
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

    // If the user is wearing a watch, destroy it.
    if (this.attachedWatches.has(userId)) this.attachedWatches.get(userId).destroy();
    this.attachedWatches.delete(userId);

    const position = { x: 0.05, y: WRIST_OFFSET, z: 0 } // move it out of the hand
    const scale = { x: 0.1, y: 0.1, z: 0.1 }
    const rotation = { x: 90, y: 0, z: 0 }
    const attachPoint = <MRE.AttachPoint> 'left-hand';

    // main object, the Watch
    const watch = MRE.Actor.Create(this.context, {
      actor: {
          transform: {
              local: {
                  position: position,
                  rotation: MRE.Quaternion.FromEulerAngles(
                      rotation.x * MRE.DegreesToRadians,
                      rotation.y * MRE.DegreesToRadians,
                      rotation.z * MRE.DegreesToRadians),
                  scale: scale
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
          font: MRE.TextFontFamily.Cursive
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
      button.setBehavior(MRE.ButtonBehavior).onClick(user => {
        this.takePoll(user, i);
      });
      const label = MRE.Actor.Create(this.context, {
        actor: {
          transform: { local: { position: { x: CHOICE_SPACING, y: 0, z: 0 } } },
          text: {
            contents: poll.choices[i].name,
            height: 0.2,
            anchor: MRE.TextAnchorLocation.MiddleLeft,
            justify: MRE.TextJustify.Left,
            font: MRE.TextFontFamily.Cursive
          },
          parentId: button.id
        }
      });

      y -= buttonSpacing;
    }

    this.attachedWatches.set(userId, watch);
  }

  private userLeft(user: MRE.User) {
    // If the user was wearing a watch, destroy it. Otherwise it would be
    // orphaned in the world.
    if (this.attachedWatches.has(user.id)) { this.attachedWatches.get(user.id).destroy(); }
    this.attachedWatches.delete(user.id);
  }

  private userJoined(user: MRE.User) {
    if(DEBUG){
      console.log("User has joined:");
      console.log(user.properties);
    }

    this.wearControls(user.id);
  }
}