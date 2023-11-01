const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

var colors = [ 'aqua' , 'azure' , 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender', 'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive', 'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon', 'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'white', 'yellow'];

const grammar = `#JSGF V1.0; grammar colors; public <color> = ${colors.join(
  " | ",
)};`;



const recognition = new SpeechRecognition();
const speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const diagnostic = document.querySelector(".input");
const bg = document.querySelector("html");
const hints = document.querySelector(".hints");

document.querySelector('#record').onclick = async () => {
  // recognition.start();
  // console.log("Ready to receive speech.");

  // TESTING
  // call a translate function
  let tSpeech = await translateSpeech('hello', 'es')
  document.querySelector('.translation').innerHTML = `<p>${tSpeech}</p>`
  
  // call a speak function
  speakWords(tSpeech, 'es')
};

recognition.onresult = async (event) => {
  const speech = event.results[0][0].transcript;
  diagnostic.textContent = `Result received: ${speech}.`;
  console.log(`Confidence: ${event.results[0][0].confidence}`);

  // TODO: auto detect language if possible
  let lang = document.querySelector('input:checked').getAttribute('data-lang')
  console.log('lang selected: ', lang)

  // call a translate function
  let tSpeech = await translateSpeech(speech, lang)
  document.querySelector('.translation').innerHTML = `<p>${tSpeech}</p>`
  
  // call a speak function
  speakWords(tSpeech, lang)
};

recognition.onspeechend = () => {
  recognition.stop();
};

recognition.onnomatch = function(event) {
  diagnostic.textContent = "I didn't recognise that speech.";
}

recognition.onerror = function(event) {
  diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
}

// SPEECH SYNTHESIS STUFF

const synth = window.speechSynthesis;

function speakWords(words, lang) {
  // this function speaks the input words back to the user
  let voice;
  for (let l of synth.getVoices()) {
    if (l['lang'] == lang) {
      voice = l //set voice
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
  console.log(words.split(' '))

  console.log(words, lang)

  const res = await axios.post(`/v1/translate`, {
    text: words,      //e.g. "hello"
    target_lang: lang, //e.g. "es"
    headers: {
      "Content-type": "application/json;"
    },
    
  });


  // await translate(words, lang)


  // console.log(res);
  console.log(res);
  
  // let newWords = await res.json().translatedText; // set this to the translated words

  let newWords = res.data
  return newWords
}