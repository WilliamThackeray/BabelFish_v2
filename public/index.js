const socket = io();




// const sleep = m => new Promise(r => setTimeout(r, m));
// await sleep(3000);




document.addEventListener('DOMContentLoaded', function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
  const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;


  const recognition = new SpeechRecognition();
  const speechRecognitionList = new SpeechGrammarList();
  // speechRecognitionList.addFromString(grammar, 1);
  recognition.grammars = speechRecognitionList;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let recorder;
  let blob;
  
  document.querySelector('#btnRecord').onclick = async () => {
    
    recognition.lang = document.querySelector('input:checked').getAttribute('data-recog-lang')
    recognition.start();
    //start button animation
    document.querySelector('#btnRecord').classList.add('rec');
    console.log('Ready to receive speech.');
    
    let stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
    recorder = new RecordRTCPromisesHandler(stream, {
      type: 'audio'
    });
    recorder.startRecording();


    // TESTING
    // call a translate function
    // let tSpeech = await translateSpeech('hello', 'es')
    // document.querySelector('.translation').innerHTML = `<p>${tSpeech}</p>`
    
  };

  recognition.onresult = async (event) => {
    const speech = event.results[0][0].transcript;
    console.log(`Confidence: ${event.results[0][0].confidence}`);

    // get language to translate too from radio input
    let lang = document.querySelector('input:checked').getAttribute('data-trans-lang')
    console.log('lang selected: ', lang)

    // call a translate function
    let tSpeech = await translateSpeech(speech, lang)

    // insert speech and translation into DOM
    // to both sockets
    // let binSpeech = [
    //   speech.dataUsingEncoding(NSUTF8StringEncoding, {allowLossyConversion: false}), 
    //   tSpeech.dataUsingEncoding(NSUTF8StringEncoding, {allowLossyConversion: false})
    // ]
    // TODO: FOR SENDING BINARY DATA
    //  websockets says we can send an ArrayBuffer()
    //  should we convert the speech to binary (like above)
    //  then get the '.byteLength' of each one, 
    //  then initialize an ArrayBuffer() with the respective lengths
    //  then send them over the sockets?
    //      Or do we misunderstand?

    await socket.emit('translation', ([speech, tSpeech], blob))
    // await socket.emit('translation', [speech, tSpeech])


    // call a speak function
    speakWords(tSpeech, lang)
  };

  recognition.onspeechend = async () => {
    //stop button animation
    document.querySelector('#btnRecord').classList.remove('rec');
    recognition.stop();
    
    await recorder.stopRecording();
    blob = await recorder.getBlob();
    // invokeSaveAsDialog(blob);
  };

  recognition.onnomatch = function(event) {
    diagnostic.textContent = "I didn't recognize that speech.";
  }

  recognition.onerror = function(event) {
    diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
  }


  // functions
  
  // SPEECH SYNTHESIS STUFF
  const synth = window.speechSynthesis;

  function speakWords(words, lang) {
    // this function speaks the input words back to the user
    // I set the name we want because the language wasn't working 
    let name
    if (lang === 'es') {
      name = 'Google español'
    }
    else {
      name = 'Microsoft Mark - English (United States)'
    }
    let voice;
    for (let v of synth.getVoices()) {
      if (v['name'] == name) {
        voice = v //set voice
        break
      }
    }
    
    const utterThis = new SpeechSynthesisUtterance(words);
    // defaults
    utterThis.voice = voice
    utterThis.pitch = 1
    utterThis.rate = 1

    synth.speak(utterThis)
  }

  async function translateSpeech(words, lang) {
    // this function translates the 'words' to the 'lang'
    //    words = the speech we want to translate 
    //    lang = the target language to translate to 

    const res = await axios.post(`/v1/translate`, {
      text: words,      //e.g. 'hello'
      target_lang: lang, //e.g. 'es'
      headers: {
        'Content-type': 'application/json;'
      },
    });

    let newWords = res.data

    return newWords
  }

})
function addText(leftText, rightText) {
  //inputs text into DOM on left and right
  let pl = document.createElement('p')
  let pr = document.createElement('p')
  let div = document.createElement('div')
  let innerTxtLeft = document.createTextNode(leftText)
  let innerTxtRight = document.createTextNode(rightText)
  div.setAttribute('class', 'space-between')
  pl.appendChild(innerTxtLeft)
  pr.appendChild(innerTxtRight)
  div.appendChild(pl)
  div.appendChild(pr)
  document.querySelector('#text').appendChild(div).scrollIntoView({behavior: 'smooth'})
}

function printText(t1, t2) {
  console.log(t1, t2)
}

socket.on('translation', (msg, blob) => {
  printText(msg[0], msg[1])
  addText(msg[0], msg[1])
  // TODO: play voice blob
  console.log(blob, '\nblob');
  invokeSaveAsDialog(blob);
  
})

