// Safari y Chrome graban en contenedores distintos. Preparar un WAV mono corto
// permite validar la duración en el servidor antes de consumir cuota.
export async function pilotWav(blob) {
  const Decoder = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!Decoder) throw Error('Este navegador no puede preparar el audio. Puedes responder por texto.');
  const sampleRate = 16000;
  const decoder = new Decoder(1, 1, sampleRate);
  let buffer;
  try { buffer = await decoder.decodeAudioData(await blob.arrayBuffer()); }
  catch { throw Error('Este navegador no pudo leer la grabación. Puedes escribir tu respuesta.'); }
  if (!buffer.numberOfChannels || buffer.duration > 32) throw Error('Vuelve a grabar una frase de hasta 30 segundos.');
  const frames = Math.min(buffer.length, 30 * sampleRate);
  const bytes = new ArrayBuffer(44 + frames*2);
  const data = new DataView(bytes);
  const tag = (offset,s) => { for(let i=0;i<s.length;i++) data.setUint8(offset+i,s.charCodeAt(i)); };
  tag(0,'RIFF');data.setUint32(4,36+frames*2,true);tag(8,'WAVE');tag(12,'fmt ');
  data.setUint32(16,16,true);data.setUint16(20,1,true);data.setUint16(22,1,true);
  data.setUint32(24,sampleRate,true);data.setUint32(28,sampleRate*2,true);
  data.setUint16(32,2,true);data.setUint16(34,16,true);tag(36,'data');data.setUint32(40,frames*2,true);
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  for(let i=0;i<frames;i++) {
    let sample=0;
    for(const channel of channels) sample+=channel[i]/channels.length;
    data.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,sample))*32767),true);
  }
  return {blob:new Blob([bytes],{type:'audio/wav'}),ms:frames*1000/sampleRate,mimeType:'audio/wav'};
}
