document.addEventListener('DOMContentLoaded', function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
  const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

  // var colors = [ 'aqua' , 'azure' , 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender', 'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive', 'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon', 'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'white', 'yellow'];

  // const grammar = `#JSGF V1.0; grammar colors; public <color> = ${colors.join(
  //   ' | ',
  // )};`;



  const recognition = new SpeechRecognition();
  const speechRecognitionList = new SpeechGrammarList();
  // speechRecognitionList.addFromString(grammar, 1);
  recognition.grammars = speechRecognitionList;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;


  document.querySelector('#btnRecord').onclick = async () => {
    recognition.lang = document.querySelector('input:checked').getAttribute('data-recog-lang')
    recognition.start();
    document.querySelector('#btnRecord').classList.add('rec');
    console.log('Ready to receive speech.');

    // TESTING
    // call a translate function
    // let tSpeech = await translateSpeech('hello', 'es')
    // document.querySelector('.translation').innerHTML = `<p>${tSpeech}</p>`
    
  };

  recognition.onresult = async (event) => {
    const speech = event.results[0][0].transcript;
    console.log(`Confidence: ${event.results[0][0].confidence}`);

    // TODO: auto detect language if possible
    let lang = document.querySelector('input:checked').getAttribute('data-trans-lang')
    console.log('lang selected: ', lang)

    // call a translate function
    let tSpeech = await translateSpeech(speech, lang)

    // insert speech and translation into DOM
    addText(speech, tSpeech)

    // call a speak function
    speakWords(tSpeech, lang)
  };

  recognition.onspeechend = () => {
    document.querySelector('#btnRecord').classList.remove('rec');
    recognition.stop();
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

  function addText(leftText, rightText) {
    //side should be 'l' for left and 'r' for right
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
})