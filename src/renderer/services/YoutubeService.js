import bus from '../bus';

const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const readline = require('readline');


const SLEEP_TIME = 400;

ffmpeg.setFfmpegPath(ffmpegPath);

export default class YoutubeService {
  static getInformations(link, callback) {
    return ytdl.getInfo(link, callback);
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static downloadAudio(link) {
    const stream = ytdl(link, { quality: 'highestaudio' });

    stream.on('response', (res) => {
      const totalSize = res.headers['content-length'];
      let dataRead = 0;
      bus.$on('cancelDownload', () => {
        bus.$emit('answer', true);
        stream.destroy();
      });
      res.on('data', (data) => {
        dataRead += data.length;
        const percent = (((dataRead / totalSize) * 99)).toFixed(0);
        bus.$emit('percentProgress', percent);
        this.sleep(SLEEP_TIME);
      });
    });
    const path = localStorage.getItem('chosenPath');
    ffmpeg(stream).audioBitrate(320).audioCodec('libmp3lame').save('tmp/cache.mp3')
      .on('progress', () => {
        readline.cursorTo(process.stdout, 0);
        bus.$on('cancelDownload', () => {
          bus.$emit('answer', true);
          stream.destroy();
        });
      })
      .on('end', () => {
        const source = fs.createReadStream('tmp/cache.mp3');
        const dest = fs.createWriteStream(`${path}.mp3`);
        source.on('close', () => {
          fs.unlinkSync('tmp/cache.mp3');
          bus.$emit('percentProgress', 100);
        });
        source.pipe(dest);
        // source.on('end', function () { /* copied */ });
        // source.on('error', function(err) { /* error */ });
      });
  }


  static makePlayer(id) {
    /* eslint-disable */
      if (this.player === undefined) {
        this.player = new YT.Player('player', {
            height: '0',
            width: '0',
            videoId: id
        });
      } else {
        this.player.loadVideoById(id);
      }

  }

  static playPlayer() {
    this.player.playVideo();
  }

  static pausePlayer() {
    this.player.pauseVideo();
  }
}
