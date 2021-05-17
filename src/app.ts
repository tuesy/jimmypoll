import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as UI from "./ui";
import * as Audio from "./audio";
import * as Controls from "./controls";
import * as Utils from "./utils";

const MAX_CHOICES = 6;
const DEBUG = false;

export type PollDescriptor = {
  name: string,
  choices: PollChoiceDescriptor[];
};

export type PollChoiceDescriptor = {
  name: string,
  userIds: Set<MRE.Guid>
}

export default class Poll {
	private assets: MRE.AssetContainer;
  private attachedControls = new Map<MRE.Guid, MRE.Actor>();
  private polls: { [key: string]: PollDescriptor } = {};

	constructor(private context: MRE.Context, private params: MRE.ParameterSet) {
		this.context.onStarted(() => this.started());
    this.context.onUserLeft(user => this.userLeft(user));
    this.context.onUserJoined(user => this.userJoined(user));
	}

	private async started() {
    this.assets = new MRE.AssetContainer(this.context);
    UI.chooseBackgroundImage(this.params);
    UI.create(this.context, this.assets);
    Audio.preload(this.assets);
	}

  private startPoll(pollId: string, input: string){
    let inputs = input.split('|');
    let pollName = Utils.pollNameFrom(inputs);
    let choiceNames = Utils.choiceNamesFrom(inputs, MAX_CHOICES);

    if(DEBUG)
      console.log(`inputs: ${inputs}, pollName: ${pollName}, choiceNames: ${choiceNames}`);

    // overrides existing polls
    this.polls[pollId] = {
      name: pollName,
      choices: []
    };

    let poll = this.polls[pollId];

    // by default, it's Yes or No
    if(choiceNames.length < 2){
      poll.choices.push({
        name: 'Yes',
        userIds: new Set<MRE.Guid>()
      });

      poll.choices.push({
        name: 'No',
        userIds: new Set<MRE.Guid>()
      });
    }
    else{
      // setup choices by name and index
      for (let i = 0; i < choiceNames.length; i++){
        poll.choices.push({
          name: choiceNames[i],
          userIds: new Set<MRE.Guid>()
        });
      }
    }

    // recreate everyone's controls
    for (let i = 0; i < this.context.users.length; i++){
      let user = this.context.users[i];
      this.wireUpControls(Controls.attach(this.context, this.attachedControls, user.id, poll));
    }

    // recreate the screen controls
    this.wireUpControls(UI.pollStarted(this.context, this.assets, poll));

    // play a sound for everyone to let people know a new poll started
    Audio.pollStarted(UI.screenHeader);

    UI.updateResults(this.context, this.assets, poll);

    if(DEBUG){
      console.log(`[Poll][Start] "${poll.name}" (${pollId})`);
      console.log(poll);
    }
  }

  private takePoll(user: MRE.User, response: number){
    let pollId = this.pollIdFor(user);

    if(pollId in this.polls){
      let poll = this.polls[pollId];
      for (let i = 0; i < poll.choices.length; i++) {
        if(i == response)
          poll.choices[i].userIds.add(user.id);
        else
          poll.choices[i].userIds.delete(user.id);
      }
      UI.updateResults(this.context, this.assets, poll);
    }
  }

  // could be from an Event or a World
  private pollIdFor(user: MRE.User) : string{
    let pollId : string;
    if(user.properties['altspacevr-event-id'])
      pollId = user.properties['altspacevr-event-id'];
    else
      pollId = user.properties['altspacevr-space-id'];
    return pollId;
  }

  // handles when user has no roles
  private canManagePolls(user: MRE.User) : boolean{
    let roles = user.properties['altspacevr-roles'].split(',');
    return roles && (roles.includes('moderator') || roles.includes('terraformer') || roles.includes('host'))
  }

  private userLeft(user: MRE.User) {
    Controls.unattach(this.attachedControls, user.id);
  }

  private userJoined(user: MRE.User) {
    if(this.canManagePolls(user))
      this.createPollButtonFor(user);

    this.wireUpControls(Controls.attach(this.context, this.attachedControls, user.id, this.polls[this.pollIdFor(user)]));
  }

  private createPollButtonFor(user: MRE.User){
    const position = { x: UI.HELP_BUTTON_POSITION.x - 0.34, y: UI.HELP_BUTTON_POSITION.y, z: UI.HELP_BUTTON_POSITION.z }; // to the left of the help button
    let text = `Enter a question and click "OK" to start a new poll.\n\nLearn more at github.com/tuesy/poll`;
    const button = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579239603192201565', // https://account.altvr.com/kits/1579230775574790691/artifacts/1579239603192201565
      actor: {
        name: 'Poll Button',
        transform: { local: { position: position } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        exclusiveToUser: user.id
      }
    });
    button.setBehavior(MRE.ButtonBehavior).onClick(user => {
      user.prompt(text, true)
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

  private wireUpControls(buttons: MRE.Actor[]){
    for (let i = 0; i < buttons.length; i++){
      buttons[i].setBehavior(MRE.ButtonBehavior).onClick(user => {
        this.takePoll(user, i);
        // play a sound for the user to give feedback since most people don't have haptic feedback enabled (to save battery)
        // attach this to the controls so it's exclusive to the user
        Audio.pollTaken(Controls.watchFor(this.attachedControls, user.id));
      });
    }
  }
}