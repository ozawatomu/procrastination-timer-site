export interface FaqEntry {
  id: string;
  question: string;
  answer: string[];
}

export const faq: FaqEntry[] = [
  {
    id: 'background',
    question: 'Do the timers keep running when I close the app?',
    answer: [
      'Yes. The app records when you tapped a side and works out the totals from the clock, so nothing needs to stay running. Close the app, lock the phone, reboot it: the numbers are right when you come back.',
      'On Android the running timer also shows in the notification shade, as a Live Update on Android 16 and later. On iPhone there is no persistent notification, but block-end alerts still arrive.',
    ],
  },
  {
    id: 'free',
    question: 'Is it really free?',
    answer: [
      'Yes. There are no ads, no subscription and nothing locked behind a payment. If the app helps you, there is an optional tip jar under Settings, and buying a tip changes nothing except a thank-you.',
    ],
  },
  {
    id: 'tracking',
    question: 'What data does it collect?',
    answer: [
      'None. There are no accounts and no analytics. Your timers and settings stay on your device. The only network access belongs to the store billing library used by the tip jar.',
    ],
  },
  {
    id: 'methods',
    question: 'Do I have to use Pomodoro?',
    answer: [
      'No. The plain two-stopwatch timer is the whole point and it is what the app opens to. If you prefer working in blocks, turn on Pomodoro, 52/17 or 112/26 under Settings, Timer method. It is off by default.',
    ],
  },
  {
    id: 'switch',
    question: 'How do I switch, pause and reset?',
    answer: [
      'Tap the side you are on now and it starts counting while the other side pauses. The round button on the seam pauses and resumes; while paused, a reset button appears next to it. Reset zeroes both timers and offers Undo for a few seconds if you had at least a minute on the clock.',
    ],
  },
  {
    id: 'tap-again',
    question: 'Why did switching ask me to tap twice?',
    answer: [
      'A timer method is on and the current block is not finished. The first tap arms the switch and the second confirms it, so a stray tap never cuts a block short. Once a block ends the other side glows and a single tap starts the next one.',
    ],
  },
  {
    id: 'notifications',
    question: 'I do not get a notification when a block ends',
    answer: [
      'Check that notifications are allowed for the app in your system settings. On Android 12 and earlier, also allow Alarms and reminders, and make sure battery optimisation is not restricting the app. Only the timer methods send block-end alerts; with the method off there is nothing to notify.',
    ],
  },
  {
    id: 'labels',
    question: 'Can I rename Studying and Procrastinating?',
    answer: [
      'Yes. Open Settings and edit Studying text or Procrastinating text. Labels can be up to 30 characters. Thesis and Reddit, Revision and Netflix, Coding and Coffee: whatever describes your day.',
    ],
  },
  {
    id: 'theme',
    question: 'How do I change the theme?',
    answer: ['Settings, Theme. Choose Light, Dark or Follow system.'],
  },
  {
    id: 'restore',
    question: 'I left a tip on another phone. How do I restore it?',
    answer: [
      'Open Settings, Support the developer and tap Restore purchases. Purchases from the original 2019 version of the app are recognised too. Tips only ever unlock a thank-you, so nothing is lost if a restore is not possible.',
    ],
  },
  {
    id: 'iphone',
    question: 'Is it on iPhone?',
    answer: [
      'An iPhone version is on its way to the App Store. This page will link to it as soon as it is live.',
    ],
  },
  {
    id: 'delete',
    question: 'How do I delete my data?',
    answer: [
      'Reset the timers in the app, or uninstall it. Everything the app stores lives on your device and nothing is kept anywhere else. See the privacy policy for details.',
    ],
  },
  {
    id: 'bug',
    question: 'How do I report a bug?',
    answer: [
      'Email ozawatomu@gmail.com with your phone model, its OS version, the app version from Settings, About, and the steps that led to the problem. Screenshots help.',
    ],
  },
];

export const homeFaq = faq.slice(0, 4);
