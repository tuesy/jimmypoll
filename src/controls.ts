import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { PollDescriptor, PollChoiceDescriptor } from "./app";
import * as Audio from "./audio";

const CHOICE_SPACING = 0.2;
const CONTROLS_SCALE = {x: 0.2, y: 0.2, z: 0.2};
const CONTROLS_POSITION = {
  x: 0.1, // move it left to accomodate long choice names
  y: -0.05, // move it out of the hand, toward you
  z: 0.1 // move it up to allow everything to be super sized
}
const FONT = MRE.TextFontFamily.Cursive;
const WATCH_ENABLED = false;
const DEBUG = false;

// returns the control buttons that were created for things to get wiredup
export function attach(context: MRE.Context, attached: Map<MRE.Guid, MRE.Actor>, userId: MRE.Guid, poll: PollDescriptor) : MRE.Actor[] {
  if (!poll){ return []; }

  unattach(attached, userId);

  const rotation = { x: 90, y: 0, z: 0 }
  const attachPoint = <MRE.AttachPoint> 'left-hand';
  let buttons : MRE.Actor[] = [];

  // main object, the Watch
  const watch = MRE.Actor.Create(context, {
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

  if(WATCH_ENABLED){
    let y = -0.2;
    const buttonSpacing = 0.3;

    // title
    const label = MRE.Actor.Create(context, {
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
      let button = MRE.Actor.CreateFromLibrary(context, {
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

      buttons.push(button);

      const label = MRE.Actor.Create(context, {
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
  }

  attached.set(userId, watch);

  return buttons;
}

export function unattach(attached: Map<MRE.Guid, MRE.Actor>, userId: MRE.Guid){
    // If the user was wearing a watch, destroy it. Otherwise it would be
    // orphaned in the world.
  if (attached.has(userId)) { attached.get(userId).destroy(); }
  attached.delete(userId);
}

export function watchFor(attached: Map<MRE.Guid, MRE.Actor>, userId: MRE.Guid) : MRE.Actor {
  if(attached.has(userId))
    return attached.get(userId);
}
