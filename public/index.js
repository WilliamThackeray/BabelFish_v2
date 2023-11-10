const socket = io();


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
  };

  recognition.onresult = async (event) => {
    const speech = event.results[0][0].transcript;
    console.log(`Confidence: ${event.results[0][0].confidence}`);

    // get language to translate too from radio input
    let lang = document.querySelector('input:checked').getAttribute('data-trans-lang')
    console.log('lang selected: ', lang)

    // call a translate function
    let tSpeech = await translateSpeech(speech, lang)
    console.log('translated text: ', tSpeech)

    // emit translation event to server
    let blob = await recorder.getBlob();
    socket.emit('voice', blob, {
      speech:[speech, tSpeech],
      lang: lang,
    })
    // reset recorder's state
    await recorder.reset();
    // clear the memory
    await recorder.destroy();
    // so that we can record again
    recorder = null;
  };

  recognition.onspeechend = async () => {
    //stop button animation
    document.querySelector('#btnRecord').classList.remove('rec');
    recognition.stop();
    
    await recorder.stopRecording();
  };

  recognition.onnomatch = function(event) {
    diagnostic.textContent = "I didn't recognize that speech.";
  }

  recognition.onerror = function(event) {
    diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
  }


  // FUNCTIONS

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

    return res.data
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


//SOCKET STUFF

const synth = window.speechSynthesis;
// catch voice event from server
socket.on('voice', (arrayBuffer, textObj) => {

  
  let blob = new Blob([arrayBuffer], { 'type' : 'audio/ogg; codecs=opus' });
  let audio = document.createElement('audio');
  audio.src = window.URL.createObjectURL(blob);
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    //call speak words
    addText(textObj.speech[0], textObj.speech[1])
  

    // call a speak function
    speakWords(textObj.speech[1], textObj.lang)

    function speakWords(words, lang) {
      // this function speaks the input words back to the user
      // I set the name we want because the language wasn't working 
      let name
      // console.log(lang)
      if (lang === 'es') {
        name = 'Google español'
      }
      else {
        name = 'Microsoft Mark - English (United States)'
      }
      let voice;
      console.log('synth.getVoices() ', synth.getVoices())
      for (let v of synth.getVoices()) {
        if (v['name'].includes(name)) {
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
  })
  let checkBox = document.querySelector('#checkbox')
  if (checkBox.checked) {
    audio.play();
  } else {
    addText(textObj.speech[0], textObj.speech[1])
  

    // call a speak function
    speakWords(textObj.speech[1], textObj.lang)

    function speakWords(words, lang) {
      // this function speaks the input words back to the user
      // I set the name we want because the language wasn't working 
      let name
      // console.log(lang)
      if (lang === 'es') {
        name = 'Google español'
      }
      else {
        name = 'Microsoft Mark - English (United States)'
      }
      let voice;
      for (let v of synth.getVoices()) {
        if (v['name'].includes(name)) {
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
  }
})
