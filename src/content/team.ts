export type Founder = {
  id: string;
  name: string;
  role: string;
  bio: string;
  focus: string[];
  portrait: string;
  github: string;
  email: string;
};

export const FOUNDERS: Founder[] = [
  {
    id: "kailosh",
    name: "Kailosh",
    role: "Co-founder, product and engineering",
    bio: "Kailosh leads product design and front-end engineering. He turns a rough idea into a working product quickly, builds the AI features and automations inside it, and often works embedded with client teams until launch.",
    focus: ["Product design", "Web and mobile", "AI and automation", "Security"],
    portrait: "/team/kailosh.jpeg",
    github: "https://github.com/Sk1zmo",
    email: "kailoshkalimuthu@northwindcipher.com",
  },
  {
    id: "keni",
    name: "Keni",
    role: "Co-founder, engineering and payments",
    bio: "Keni leads back-end and full-stack engineering. He builds the payment flows, subscriptions and internal tools that keep a product running and earning, and brings in blockchain where it genuinely solves the problem.",
    focus: ["Full-stack", "Payments and billing", "Internal tools", "Blockchain"],
    portrait: "/team/keni.jpeg",
    github: "https://github.com/KenidoesCode",
    email: "pranauvshrinaath@northwindcipher.com",
  },
];
