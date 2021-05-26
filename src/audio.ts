import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const DEBUG = false;

export function preload(assets: MRE.AssetContainer){
  assets.createSound('startSound', { uri: 'start.ogg' } );
  assets.createSound('clickSound', { uri: 'click.ogg' } );
}

export function pollStarted(assets: MRE.AssetContainer, actor: MRE.Actor){
  if(actor){
    actor.startSound(assets.sounds.find(x => x.name === 'startSound').id, {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: 1000 // everyone needs to hear it, albeit at a low volume
    });
  }
}

export function pollTaken(assets: MRE.AssetContainer, actor: MRE.Actor){
  if(actor){
    actor.startSound(assets.sounds.find(x => x.name === 'clickSound').id, {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: 2.5
    });
  }
}
