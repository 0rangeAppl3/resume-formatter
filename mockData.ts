import type { ResumeData } from './types';

export const mockResumeData: ResumeData = {
  contactInfo: {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '555-123-4567',
    linkedin: 'https://linkedin.com/in/janedoe',
    portfolio: 'https://janedoe.dev',
    location: 'San Francisco, CA',
  },
  summary: 'A highly motivated and experienced software engineer with a passion for building scalable and user-friendly web applications. Proficient in TypeScript, React, and Node.js.',
  qualifications: [
    'Expert in modern frontend frameworks (React, Vue).',
    'Proficient in backend development with Node.js and Express.',
    'Experienced with cloud platforms like AWS and Google Cloud.',
    'Strong understanding of database design and management (SQL & NoSQL).',
  ],
  workExperience: [
    {
      jobTitle: 'Senior Frontend Engineer',
      company: 'Tech Solutions Inc.',
      location: 'Palo Alto, CA',
      startDate: 'Jan 2022',
      endDate: 'Present',
      description: [
        'Led the development of a new customer-facing dashboard using React and TypeScript, resulting in a 20% increase in user engagement.',
        'Mentored junior engineers and conducted code reviews to maintain high code quality standards.',
        'Collaborated with UX/UI designers to implement complex and responsive user interfaces.',
      ],
    },
    {
      jobTitle: 'Software Engineer',
      company: 'Innovate Co.',
      location: 'San Jose, CA',
      startDate: 'Jun 2019',
      endDate: 'Dec 2021',
      description: [
        'Developed and maintained features for a large-scale e-commerce platform.',
        'Wrote unit and integration tests to ensure application reliability.',
        'Participated in an agile development process, including sprint planning and daily stand-ups.',
      ],
    },
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'State University',
      location: 'San Francisco, CA',
      graduationDate: 'May 2019',
    },
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'Docker', 'AWS', 'Git'],
  portfolioProjects: [
    {
      projectName: 'Personal Portfolio Website',
      description: 'A responsive personal portfolio website built with Next.js and deployed on Vercel.',
      technologies: ['Next.js', 'React', 'Tailwind CSS'],
      link: 'https://janedoe.dev',
    },
  ],
};
