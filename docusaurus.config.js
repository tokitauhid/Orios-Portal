// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Orios Class',
  tagline: 'Your smart class companion — Notes, Assignments, Events & more',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://orios-class.example.com',
  baseUrl: '/',

  organizationName: 'orios',
  projectName: 'orios-class',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Orios Class',
        logo: {
          alt: 'Orios Class Logo',
          src: 'img/logo.svg',
        },
        items: [
          { to: '/notes', label: '📝 Notes', position: 'left' },
          { to: '/assignments', label: '📋 Assignments', position: 'left' },
          { to: '/lab-reports', label: '🔬 Lab Reports', position: 'left' },
          { to: '/calendar', label: '📅 Calendar', position: 'left' },
          { to: '/doom-clock', label: '⏳ Doom Clock', position: 'left' },
          { to: '/teachers', label: '👨‍🏫 Teachers', position: 'left' },
          { to: '/files', label: '📁 Files', position: 'left' },
          { to: '/admin', label: '⚙️ Admin Panel', position: 'right' },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Academics',
            items: [
              { label: 'Notes', to: '/notes' },
              { label: 'Assignments', to: '/assignments' },
              { label: 'Lab Reports', to: '/lab-reports' },
            ],
          },
          {
            title: 'Campus',
            items: [
              { label: 'Calendar & Events', to: '/calendar' },
              { label: 'Teacher Directory', to: '/teachers' },
              { label: 'File Sharing', to: '/files' },
            ],
          },
          {
            title: 'Quick Links',
            items: [
              { label: 'Home', to: '/' },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} Orios Class Portal. Built with ❤️`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
