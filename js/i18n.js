// Translations. Add a language by copying a block and adding it to LANGUAGES.

const TRANSLATIONS = {
  en: {
    'nav.home': 'Home',
    'nav.bio': 'Bio',
    'nav.music': 'Music',
    'nav.links': 'Links',

    'hero.eyebrow': "Hi, I'm",
    'hero.tagline': 'I occasionally do productive things.',
    'hero.bio': 'About me',
    'hero.links': 'Links',

    'about.title': 'About',
    'about.p1': 'Write a couple of lines about yourself here.',
    'about.p2': 'What you work on, what you like, anything worth mentioning.',
    'about.p3': 'Keep it short, the whole point is that people read it.',

    'skills.title': 'Skills',

    'music.title': 'Music',
    'music.subtitle': 'The songs I keep on repeat.',

    'links.title': 'Links',

    'footer.text': 'made with too much coffee'
  },

  es: {
    'nav.home': 'Inicio',
    'nav.bio': 'Bio',
    'nav.music': 'Música',
    'nav.links': 'Links',

    'hero.eyebrow': 'Hola, soy',
    'hero.tagline': 'A veces hago cosas productivas.',
    'hero.bio': 'Sobre mí',
    'hero.links': 'Links',

    'about.title': 'Sobre mí',
    'about.p1': 'Escribe aquí un par de líneas sobre ti.',
    'about.p2': 'En qué trabajas, qué te gusta, lo que merezca la pena.',
    'about.p3': 'Que sea corto, la idea es que la gente lo lea.',

    'skills.title': 'Habilidades',

    'music.title': 'Música',
    'music.subtitle': 'Las canciones que no paro de poner.',

    'links.title': 'Links',

    'footer.text': 'hecho con demasiado café'
  }
};

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' }
];

const DEFAULT_LANG = 'en';

window.I18N = { TRANSLATIONS, LANGUAGES, DEFAULT_LANG };
