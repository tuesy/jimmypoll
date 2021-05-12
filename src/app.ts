import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const fetch = require('node-fetch');
const url = require('url')
const WELCOME_TEXT = 'Poll App';
const INFO_TEXT_HEIGHT = 1.2;
const BUTTON_HEIGHT = 0.6;
const DEBUG = true;

type PollDescriptor = {
  name: string,
  yes: Set<string>;
  no: Set<string>;
};

export default class Poll {
	private assets: MRE.AssetContainer;
  private attachedWatches = new Map<MRE.Guid, MRE.Actor>();
  private libraryActors: MRE.Actor[] = [];
  private infoText : any;
  private polls: { [key: string]: PollDescriptor } = {};

	constructor(private context: MRE.Context, private params: MRE.ParameterSet) {
		this.context.onStarted(() => this.started());
    this.context.onUserLeft(user => this.userLeft(user));
    this.context.onUserJoined(user => this.userJoined(user));
	}

	private async started() {
		this.assets = new MRE.AssetContainer(this.context);
    this.createInterface();
    this.startPoll('1135296936455177005', 'test');
	}

  private startPoll(pollId: string, name: string){
    name = name.trim().charAt(0).toUpperCase() + name.slice(1); // capitalize first letter
    if(name.charAt(name.length-1) != '?') // stick a question at the end
      name += '?';

    this.infoText.text.contents = `Poll: ${name}`;

    // overrides exxisting polls
    this.polls[pollId] = {
      name: name,
      yes: new Set<string>(),
      no: new Set<string>(),
    };

    if(DEBUG)
      console.log(`[Poll] Start: "${name}" (${pollId})`);
  }

  private takePoll(user: MRE.User, response: string){
    let userId = String(user.id);
    let pollId = this.pollIdFor(user);
    // update poll database

    if(pollId in this.polls){
      let poll = this.polls[pollId];
      if(response == 'Yes'){
        poll.yes.add(userId);
        poll.no.delete(userId);
      }
      if(response == 'No'){
        poll.yes.delete(userId);
        poll.no.add(userId);
      }
      this.updatePoll(pollId);
    }
  }

  private updatePoll(pollId: string){
    let poll = this.polls[pollId];
    if(poll){
      this.infoText.text.contents = `${poll.name}\n\nYes: ${poll.yes.size}\nNo: ${poll.no.size}`;
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
    this.infoText = MRE.Actor.Create(this.context, {
      actor: {
        name: 'Info Text',
        transform: { local: { position: { x: 0, y: INFO_TEXT_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        text: {
          contents: WELCOME_TEXT,
          height: 0.1,
          anchor: MRE.TextAnchorLocation.MiddleCenter,
          justify: MRE.TextJustify.Center
        }
      }
    });

    const helpButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579238405710021245',
      actor: {
        name: 'Help Button',
        transform: { local: { position: { x: 0.35, y: BUTTON_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
      }
     });
    helpButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      user.prompt(`This app helps you polls users in your Event or World`).then(res => {
          let pollId = this.pollIdFor(user);
          if(res.submitted){
            // clicked 'OK'
            this.takePoll(user, 'Yes');
          }
          else{
            // clicked 'Cancel'
            this.takePoll(user, 'No');
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
        transform: { local: { position: { x: 0, y: BUTTON_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
      }
    });
    pollButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      if(this.canManagePolls(user)){
        user.prompt(`Enter a question and click "OK" (e.g. 'is this the year of vr' => 'Is this the year of VR?').`, true)
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
    // If the user is wearing a watch, destroy it.
    if (this.attachedWatches.has(userId)) this.attachedWatches.get(userId).destroy();
    this.attachedWatches.delete(userId);

    const position = { x: 0, y: -0.04, z: 0 } // move it out of the hand
    const scale = { x: 0.1, y: 0.1, z: 0.1 }
    const rotation = { x: 90, y: 0, z: 0 }
    const attachPoint = <MRE.AttachPoint> 'left-hand';

    const watch = MRE.Actor.Create(this.context, {
      // resourceId: 'artifact:1579238405710021245',
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
          }
      }
    })

    const buttonSpacing = 0.2;

    // add buttons
    const yesButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579239603192201565', // https://account.altvr.com/kits/1579230775574790691/artifacts/1579239603192201565
      actor: {
        transform: { local: { position: { x: -buttonSpacing, y: 0, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        parentId: watch.id
      }
    });
    yesButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      this.takePoll(user, 'Yes');
    });

    const noButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579238405710021245', // https://account.altvr.com/kits/1579230775574790691/artifacts/1579239603192201565
      actor: {
        transform: { local: { position: { x: buttonSpacing, y: 0, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        parentId: watch.id
      }
    });
    noButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      this.takePoll(user, 'No');
    });

    this.attachedWatches.set(userId, watch);
  }

  private userLeft(user: MRE.User) {
    // If the user was wearing a watch, destroy it. Otherwise it would be
    // orphaned in the world.
    if (this.attachedWatches.has(user.id)) { this.attachedWatches.get(user.id).destroy(); }
    this.attachedWatches.delete(user.id);
  }

  private userJoined(user: MRE.User) {
    let pollId = this.pollIdFor(user);
    if(!(pollId in this.polls))
      return;

    this.wearControls(user.id);
  }
}