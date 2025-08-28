
export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  portfolio?: string;
  location: string;
}

export interface WorkExperience {
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  graduationDate: string;
}

export interface PortfolioProject {
  projectName: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface ResumeData {
  contactInfo: ContactInfo;
  summary: string;
  qualifications?: string[];
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  portfolioProjects?: PortfolioProject[];
}
