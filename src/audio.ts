import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const DEBUG = false;

export function preload(assets: MRE.AssetContainer){
  assets.createSound('start', { uri: 'start.ogg' } );
  assets.createSound('click', { uri: 'click.ogg' } );
}

export function playStartSound(assets: MRE.AssetContainer, actor: MRE.Actor){
  if(actor){
    actor.startSound(assets.sounds.find(x => x.name === 'start').id, {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: 1000 // everyone needs to hear it, albeit at a low volume
    });
  }
}

export function playClickSound(assets: MRE.AssetContainer, actor: MRE.Actor){
  if(actor){
    actor.startSound(assets.sounds.find(x => x.name === 'click').id, {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: 2.5
    });
  }
}
