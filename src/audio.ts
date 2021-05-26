import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const SOUNDS = ['start', 'click'];
const DEBUG = false;

export function preload(assets: MRE.AssetContainer){
  for(let i=0; i < SOUNDS.length; i++){
    let name = SOUNDS[i];
    let sound = assets.sounds.find(x => x.name === name)
    if(!sound)
      // e.g. assets.createSound('start', { uri: 'start.ogg' } );
      assets.createSound(name, { uri: `${name}.ogg` } );
  }
}

export function playStartSound(assets: MRE.AssetContainer, actor: MRE.Actor){
  play(assets, actor, 'start', 1000);
}

export function playClickSound(assets: MRE.AssetContainer, actor: MRE.Actor){
  play(assets, actor, 'click', 2.5);
}

function play(assets: MRE.AssetContainer, actor: MRE.Actor, name: string, rolloff: number){
  let sound = assets.sounds.find(x => x.name === name);

  if(!sound){
    preload(assets);
  }

  if(actor){
    actor.startSound(sound.id, {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: rolloff
    });
  }
}
