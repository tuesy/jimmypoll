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
  private libraryActors: MRE.Actor[] = [];
  private infoText : any;
  private polls: { [key: string]: PollDescriptor } = {};

	constructor(private context: MRE.Context, private params: MRE.ParameterSet) {
		this.context.onStarted(() => this.started());
	}

	private async started() {
		this.assets = new MRE.AssetContainer(this.context);

    this.createInterface();

    // moderator initiates the poll
    if(DEBUG){
      this.startPoll('1135296936455177005', 'doge');
    }
	}


  private startPoll(pollId: string, name: string){
    name = name.trim().charAt(0).toUpperCase() + name.slice(1); // capitalize first letter
    if(name.charAt(name.length-1) != '?') // stick a question at the end
      name += '?';

    this.infoText.text.contents = name;

    // overrides exxisting polls
    this.polls[pollId] = {
      name: name,
      yes: new Set<string>(),
      no: new Set<string>(),
    };

    if(DEBUG)
      console.log(`Starting poll: ${name}`);
  }

  private takePoll(pollId: string, user: MRE.User, response: string){
    let userId = String(user.id);
    // update poll database

    if(response == 'Yes'){
      this.polls[pollId].yes.add(userId);
      this.polls[pollId].no.delete(userId);
    }
    if(response == 'No'){
      this.polls[pollId].yes.delete(userId);
      this.polls[pollId].no.add(userId);
    }

    this.updatePoll(pollId);

    if(DEBUG)
      console.log(this.polls);
  }

  private updatePoll(pollId: string){
    let poll = this.polls[pollId];
    if(poll){
      this.infoText.text.contents = `${poll.name}\n\nYes: ${poll.yes.size}\nNo: ${poll.no.size}`;
    }
  }

  private pollIdFor(user: MRE.User) : string{
    let pollId = null;
    if(user.properties['altspacevr-event-id']){
      pollId = user.properties['altspacevr-event-id'];
      if(DEBUG)
        console.log(`PollId: ${pollId} (Event)`);
    }
    else{
      pollId = user.properties['altspacevr-space-id'];
      if(DEBUG)
        console.log(`PollId: ${pollId} (World)`);
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
            this.takePoll(pollId, user, 'Yes');
          }
          else{
            // clicked 'Cancel'
            this.takePoll(pollId, user, 'No');
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
      user.prompt(`Enter a poll question and click "OK". We'll format it to save you the trouble. (e.g. 'doge' => 'Doge?').`, true)
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