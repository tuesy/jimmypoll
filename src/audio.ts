import * as MRE from '@microsoft/mixed-reality-extension-sdk';

let startSound : MRE.Sound;
let clickSound : MRE.Sound;

const DEBUG = false;

export function preload(assets: MRE.AssetContainer){
  startSound = assets.createSound('startSound', { uri: 'start.ogg' } );
  clickSound = assets.createSound('clickSound', { uri: 'click.ogg' } );
}

export function pollStarted(actor: MRE.Actor){
  if(actor){
    actor.startSound(startSound.id, {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: 2.5
    });
  }
}

export function pollTaken(actor: MRE.Actor){
  if(actor){
    actor.startSound(clickSound.id, {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: 1000 // everyone needs to hear it, albeit at a low volume
    });
  }
}

