/**
 * Default (seed) website content. Every statement here comes from the approved
 * Auryx Business Analysis Document / development brief. Admins can edit all of
 * it in the dashboard; nothing here should be extended with unverified claims.
 */

export const SITE = {
  name: "Auryx Software",
  shortName: "Auryx",
  tagline: "The Silent Force Behind Smarter Software.",
  email: "info@auryx.net",
  location: "Calatagan, Batangas, Philippines",
};

export type SiteSettings = {
  contactEmail: string;
  location: string;
  tagline: string;
};

export type HomeContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  aiTitle: string;
  aiText: string;
  whyTitle: string;
  whyItems: { title: string; text: string }[];
  ctaTitle: string;
  ctaText: string;
};

export type AboutContent = {
  intro: string;
  description: string;
  founderName: string;
  founderRole: string;
  founderBio: string;
  approachTitle: string;
  approach: { title: string; text: string }[];
  /** Optional founder photo (uploaded in Admin). The bulb mark is shown when absent. */
  founderImageId?: string;
  founderImageAlt?: string;
};

export type PrivacyContent = {
  version: string;
  lastUpdated: string;
  body: string; // Markdown
};

export const DEFAULT_SITE: SiteSettings = {
  contactEmail: SITE.email,
  location: SITE.location,
  tagline: SITE.tagline,
};

export const DEFAULT_HOME: HomeContent = {
  heroEyebrow: "Software · Automation · Maritime Systems",
  heroTitle: "Practical software for real-world operations.",
  heroText:
    "Auryx Software helps businesses turn ideas and operational challenges into practical software solutions, with particular expertise in maritime systems and processes.",
  aiTitle: "Accelerated by AI. Guided and reviewed by people.",
  aiText:
    "We use AI where it adds practical value, to support software development, automation and analysis. Every AI-assisted result is guided and reviewed by people who understand your business.",
  whyTitle: "Why work with Auryx",
  whyItems: [
    {
      title: "Practical technology",
      text: "We focus on solutions that fit how your organization actually works, not technology for its own sake.",
    },
    {
      title: "We start with your process",
      text: "Understanding your workflows and business needs comes before writing code.",
    },
    {
      title: "Maritime domain expertise",
      text: "Founded by a maritime professional with hands-on experience as a Captain, grounding our work in real industry needs.",
    },
    {
      title: "Custom, not one-size-fits-all",
      text: "Web, mobile and business systems tailored to your organization's requirements.",
    },
    {
      title: "Automation where it helps",
      text: "We look for repetitive manual work that can be streamlined, and tell you when it can't.",
    },
    {
      title: "Human-guided AI",
      text: "AI accelerates our work; people stay responsible for reviewing and guiding it.",
    },
  ],
  ctaTitle: "Let's talk about your challenge.",
  ctaText:
    "Tell us what you're working on. We'll listen, ask the right questions, and work with you toward a practical solution.",
};

export const DEFAULT_ABOUT: AboutContent = {
  intro: "A technology partner, not simply a software vendor.",
  description:
    "Auryx Software is a technology company that helps businesses turn ideas and operational challenges into practical software solutions. We specialize in web and mobile applications, process automation, and AI-assisted solutions, with particular expertise in maritime systems and processes.",
  founderName: "Capt. Knut Bentzrod",
  founderRole: "Founder",
  founderBio:
    "Capt. Knut Bentzrod is the Founder of Auryx Software and a maritime professional with hands-on experience as a Captain and years of experience serving within the maritime sector. His practical understanding of maritime operations helps Auryx develop technology solutions grounded in real-world industry needs.",
  approachTitle: "How we think about technology",
  approach: [
    {
      title: "Nordic discipline",
      text: "Structured, careful work with clear communication and attention to detail.",
    },
    {
      title: "Filipino warmth",
      text: "Approachable, collaborative and genuinely invested in the people we work with.",
    },
    {
      title: "Human-guided AI",
      text: "Accelerated by AI. Guided and reviewed by people.",
    },
  ],
};

export const DEFAULT_PRIVACY: PrivacyContent = {
  version: "draft-1",
  lastUpdated: "2026-09-29",
  body: `> **Draft for review.** This notice must be reviewed and approved by the responsible Auryx person before launch. It is written to support transparency under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) but does not by itself guarantee compliance.

## Who we are

Auryx Software ("Auryx", "we", "us") is the personal information controller for information collected through this website.
Location: Calatagan, Batangas, Philippines. Contact: [info@auryx.net](mailto:info@auryx.net).

## What we collect

- **Contact form:** your name or nickname, your message, and, only if you choose to provide them, your contact number and email address.
- **Consultation booking:** your name, contact number, email address, and any topic you choose to share.
- **AI chat assistant:** the content of your conversation and any contact details you voluntarily provide in it.
- **Technical data:** limited technical information (such as a one-way hashed IP address) used to prevent spam and abuse.

## Why we collect it

- To respond to your inquiry and follow up on potential projects.
- To schedule, confirm, reschedule or cancel consultations.
- To answer questions through the chat assistant and route you to a person where needed.
- To protect the website against spam and misuse.

We collect only what we need for these purposes.

## Who receives it

Your information is accessible to authorized Auryx personnel. We use service providers to operate the website, which may process your information on our behalf: our hosting and database provider, our email provider, Google (Google Workspace / Google Calendar, for consultation bookings), and an AI model provider (for the chat assistant). We do not sell your personal information.

## How long we keep it

- Contact inquiries and consultation booking records: up to **12 months**.
- Chat assistant conversations: up to **6 months**.

After these periods, records are deleted unless a legitimate or legal reason requires longer retention.

## Your rights

Under the Data Privacy Act you may have the right to be informed, to access, to object, to correct (rectification), to erasure or blocking, to data portability, and to damages, as well as the right to file a complaint with the National Privacy Commission. To exercise these rights, contact us at [info@auryx.net](mailto:info@auryx.net).

## How we protect it

We use reasonable organizational, physical and technical measures to protect your information, including access controls and encrypted connections. No method of transmission or storage is completely secure.

## Changes

We may update this notice. The version and date at the top of this page show when it last changed.`,
};

export type ServiceSeed = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  features: string[];
  icon: string;
};

export const DEFAULT_SERVICES: ServiceSeed[] = [
  {
    slug: "maritime-school-systems",
    title: "Maritime School Systems",
    icon: "anchor",
    summary:
      "Digital solutions for maritime education institutions, designed around how maritime schools actually operate.",
    body: "Maritime training institutions manage students, cadets, instructors, schedules and certifications across many connected processes. Auryx builds digital tools that support these workflows, informed by hands-on maritime experience.\n\nEvery institution is different, so we start by understanding your processes and requirements before recommending a solution. Compliance-related tools are designed to support your team's own processes; they do not replace your institution's responsibility for regulatory compliance.",
    features: [
      "Student management",
      "Curriculum planning",
      "Certification tracking",
      "Attendance and process management",
      "Compliance-related tools",
      "Institution-specific workflows",
    ],
  },
  {
    slug: "business-process-automation",
    title: "Business Process Automation",
    icon: "workflow",
    summary:
      "Streamline operations and reduce repetitive manual work with automation that fits your existing processes.",
    body: "Many organizations rely on spreadsheets, paper forms and repeated manual steps. We help identify processes that are suitable for automation and build software that connects them, so your team can spend less time on repetitive tasks and more time on work that matters.\n\nWhere AI can add practical value, we may use it as part of the solution, always with human review.",
    features: [
      "Streamlined operations",
      "Less repetitive manual work",
      "Improved workflows",
      "Fewer avoidable errors",
      "Connected business processes",
      "Better reporting",
    ],
  },
  {
    slug: "custom-software-development",
    title: "Custom Software Development",
    icon: "code",
    summary:
      "Web and mobile applications, business systems and internal tools, tailored to your requirements.",
    body: "When off-the-shelf software doesn't fit, we build software around your needs, from customer-facing web and mobile applications to internal business tools and integrations.",
    features: [
      "Web applications",
      "Mobile applications",
      "Business systems",
      "Enterprise systems",
      "API development",
      "Cloud-based solutions",
      "Custom internal tools",
    ],
  },
  {
    slug: "it-consultation-system-integration",
    title: "IT Consultation & System Integration",
    icon: "network",
    summary:
      "Guidance on technology strategy and architecture, and integration of the systems you already use.",
    body: "Not every challenge needs new software. We help you assess your current technology and processes, plan a practical path forward, and connect existing systems so they work together.",
    features: [
      "Technology strategy",
      "System architecture",
      "Legacy integration",
      "Digital transformation",
      "Technology and process assessment",
      "System integration",
    ],
  },
];

export const DEFAULT_CASE_STUDY = {
  slug: "maritime-attendance-system",
  title: "Maritime Attendance System",
  summary:
    "An attendance solution for a maritime school, combining mobile applications with web-based administration.",
  clientContext:
    "A maritime education institution needed a more structured way to record and monitor attendance, in the context of EMSA-related requirements for maritime training.",
  challenge:
    "Recording and monitoring attendance for cadets and instructors needed to be reliable, traceable and easy to review for school administration.",
  solution:
    "Auryx developed an attendance system combining mobile applications for recording attendance with a web-based administration portal for the school.",
  features: [
    "Cadet attendance",
    "Instructor attendance",
    "Mobile applications",
    "QR-based attendance",
    "Web administration",
    "Reporting and monitoring",
    "School administration tools",
  ],
  technology: "",
  outcome: "",
  body: "This case study describes the system's scope and concept. It does not claim regulatory certification or specific compliance outcomes.",
};

export type FaqSeed = { question: string; answer: string; keywords: string; category: "faq" | "company" };

export const DEFAULT_FAQ: FaqSeed[] = [
  {
    category: "faq",
    question: "What does Auryx do?",
    answer:
      "Auryx provides software and technology solutions including web and mobile development, process automation, AI-assisted solutions, and business technology consultation.",
    keywords: "auryx, services, offer, offering, company, business, solutions, overview, specialize",
  },
  {
    category: "faq",
    question: "What types of software can Auryx develop?",
    answer:
      "Custom web applications, mobile applications, business systems, and software solutions tailored to business processes and needs.",
    keywords: "software, build, develop, type, kind, web, application, system, custom",
  },
  {
    category: "faq",
    question: "Does Auryx develop mobile apps?",
    answer: "Yes. Mobile application development is part of Auryx's software development services.",
    keywords: "mobile, application, android, ios, phone, smartphone",
  },
  {
    category: "faq",
    question: "Does Auryx work with maritime organizations?",
    answer: "Yes. Maritime systems and process automation are a key area of Auryx's expertise.",
    keywords: "maritime, ship, school, seafarer, cadet, shipping, vessel, academy, training, organization",
  },
  {
    category: "faq",
    question: "Can Auryx automate an existing business process?",
    answer:
      "Yes. Auryx can help identify suitable processes for automation and develop appropriate software or automation solutions.",
    keywords: "automate, automation, process, workflow, manual, existing, streamline",
  },
  {
    category: "faq",
    question: "Does Auryx use AI?",
    answer:
      "Yes. Auryx can incorporate AI where it provides practical value, to support software development, automation, analysis and other technology solutions, with human guidance, review and oversight.",
    keywords: "ai, artificial, intelligence, machine, learning, chatgpt, llm, integrate",
  },
  {
    category: "faq",
    question: "How can I request a consultation?",
    answer:
      "Use the website's Book a Consultation page to choose an available time. Consultations are available Monday to Friday, 8:00 AM to 5:00 PM Philippine time.",
    keywords: "consultation, book, meeting, schedule, appointment, call",
  },
  {
    category: "faq",
    question: "How can I contact Auryx?",
    answer:
      "Use the Contact page to send a message, email info@auryx.net, or book a consultation.",
    keywords: "contact, email, reach, message, talk, phone, get in touch",
  },
  {
    category: "company",
    question: "Where is Auryx located?",
    answer: "Auryx Software is located in Calatagan, Batangas, Philippines.",
    keywords: "location, located, based, address, office, philippines, batangas, calatagan",
  },
  {
    category: "company",
    question: "Who founded Auryx?",
    answer:
      "Auryx Software was founded by Capt. Knut Bentzrod, a maritime professional with hands-on experience as a Captain and years of experience serving within the maritime sector.",
    keywords: "founder, founded, owner, knut, bentzrod, captain, behind, started",
  },
];
