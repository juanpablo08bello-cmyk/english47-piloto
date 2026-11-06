export function wav(pcm) {
  const h = Buffer.alloc(44);
  h.write('RIFF'); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// Aceptar únicamente el formato generado por el cliente del piloto.
export function pilotWavSeconds(audio) {
  if (audio.length < 44 || audio.length > 44 + 30*32000 || (audio.length-44)%2) return 0;
  if (audio.toString('ascii',0,4)!=='RIFF' || audio.toString('ascii',8,16)!=='WAVEfmt ' ||
      audio.toString('ascii',36,40)!=='data' || audio.readUInt32LE(4)!==audio.length-8 ||
      audio.readUInt32LE(16)!==16 || audio.readUInt16LE(20)!==1 || audio.readUInt16LE(22)!==1 ||
      audio.readUInt32LE(24)!==16000 || audio.readUInt32LE(28)!==32000 ||
      audio.readUInt16LE(32)!==2 || audio.readUInt16LE(34)!==16 || audio.readUInt32LE(40)!==audio.length-44) return 0;
  return (audio.length-44)/32000;
}
