import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as UI from "./ui";
import * as Audio from "./audio";
import * as Utils from "./utils";

const fetch = require('node-fetch');
const url = require('url')
const MAX_CHOICES = 6;
const CHOICE_SPACING = 0.2;
const CONTROLS_SCALE = {x: 0.2, y: 0.2, z: 0.2};
const CONTROLS_POSITION = {
  x: 0.1, // move it left to accomodate long choice names
  y: -0.05, // move it out of the hand, toward you
  z: 0.1 // move it up to allow everything to be super sized
}

const DEBUG = true;

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
  private infoText : any;
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

    // overrides exxisting polls
    this.polls[pollId] = {
      name: pollName,
      choices: []
    };

    // by default, it's Yes or No
    if(choiceNames.length < 2){
      this.polls[pollId].choices.push({
        name: 'Yes',
        userIds: new Set<MRE.Guid>()
      });

      this.polls[pollId].choices.push({
        name: 'No',
        userIds: new Set<MRE.Guid>()
      });
    }
    else{
      // setup choices by name and index
      for (let i = 0; i < choiceNames.length; i++){
        this.polls[pollId].choices.push({
          name: choiceNames[i],
          userIds: new Set<MRE.Guid>()
        });
      }
    }

    // recreate everyone's controls
    for (let i = 0; i < this.context.users.length; i++){
      let user = this.context.users[i];
      this.removeControls(user.id);
      this.wearControls(user.id);
    }

    UI.pollStarted(this.context, this.assets, this.polls[pollId]);

    // play a sound for everyone to let people know a new poll started
    Audio.pollStarted(UI.infoText);

    if(DEBUG){
      console.log(`[Poll][Start] "${pollName}" (${pollId})`);
      console.log(this.polls[pollId]);
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
          justify: MRE.TextJustify.Left//,
          // font: FONT
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
        // attach this to the controls so it's exclusive to the user
        Audio.pollTaken(watch);
      });
      const label = MRE.Actor.Create(this.context, {
        actor: {
          transform: { local: { position: { x: CHOICE_SPACING, y: 0, z: 0 } } },
          text: {
            contents: poll.choices[i].name,
            height: 0.2,
            anchor: MRE.TextAnchorLocation.MiddleLeft,
            justify: MRE.TextJustify.Left//,
            // font: FONT
          },
          parentId: button.id
        }
      });

      y -= buttonSpacing;
    }

    this.attachedControls.set(userId, watch);
  }

  private userLeft(user: MRE.User) {
    this.removeControls(user.id);
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

  private removeControls(userId: MRE.Guid){
    // If the user was wearing a watch, destroy it. Otherwise it would be
    // orphaned in the world.
    if (this.attachedControls.has(userId)) { this.attachedControls.get(userId).destroy(); }
    this.attachedControls.delete(userId);
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
}