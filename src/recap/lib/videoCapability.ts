// Sync feature probe for the video exporter, deliberately kept in its own module.
// RecapPage calls this during render to decide which export buttons to show, so it
// must be statically importable — while videoExport.ts (which used to host it)
// imports html2canvas and mp4-muxer at the top. Importing it from there would pull
// several megabytes into the Recap chunk just to ask the browser a question.

export function videoCapability(): 'mp4' | 'webm' | 'none' {
  if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined') return 'mp4'
  try {
    const canvas = document.createElement('canvas')
    const hasStream = typeof (canvas as HTMLCanvasElement & { captureStream?: unknown }).captureStream === 'function'
    if (hasStream && typeof MediaRecorder !== 'undefined') return 'webm'
  } catch { /* */ }
  return 'none'
}
