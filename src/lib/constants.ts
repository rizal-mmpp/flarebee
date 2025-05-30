import type { Category, Template } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Dashboards', slug: 'dashboards' },
  { id: '2', name: 'E-commerce', slug: 'ecommerce' },
  { id: '3', name: 'POS', slug: 'pos' },
  { id: '4', name: 'Portfolio', slug: 'portfolio' },
  { id: '5', name: 'Landing Pages', slug: 'landing-pages' },
];

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 'template-nexus',
    title: 'Nexus Dashboard Pro',
    description: 'A comprehensive admin dashboard template with modern UI components.',
    longDescription: 'Nexus Dashboard Pro is a feature-rich admin template built with Next.js and Tailwind CSS. It includes various charts, tables, forms, and UI elements to kickstart your next project. Responsive design ensures compatibility across all devices. Ideal for SaaS applications, project management tools, and analytics platforms.',
    category: CATEGORIES[0],
    price: 49,
    tags: ['Next.js', 'Tailwind CSS', 'Dashboard', 'Admin', 'Charts'],
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'dashboard interface',
    screenshots: [
      'https://placehold.co/800x600.png',
      'https://placehold.co/800x600.png',
      'https://placehold.co/800x600.png',
    ],
    previewUrl: '#',
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript', 'Chart.js'],
    createdAt: new Date('2023-10-15T10:00:00Z').toISOString(),
    author: 'AdminUser',
  },
  {
    id: 'template-cartify',
    title: 'Cartify E-commerce Suite',
    description: 'A sleek and modern e-commerce template for online stores.',
    longDescription: 'Cartify provides a complete e-commerce solution with product listings, shopping cart, checkout process, and user accounts. Built for performance and scalability, it offers a great user experience. Perfect for fashion, electronics, or any online retail business.',
    category: CATEGORIES[1],
    price: 79,
    tags: ['React', 'Stripe', 'E-commerce', 'Shopify Alternative', 'PWA'],
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'ecommerce website',
    screenshots: [
      'https://placehold.co/800x600.png',
      'https://placehold.co/800x600.png',
    ],
    previewUrl: '#',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe API'],
    createdAt: new Date('2023-11-01T14:30:00Z').toISOString(),
    author: 'AdminUser',
  },
  {
    id: 'template-foliox',
    title: 'FolioX Creative Portfolio',
    description: 'A stunning portfolio template for creatives and freelancers.',
    longDescription: 'Showcase your work with FolioX, a visually appealing portfolio template. It features smooth animations, filterable galleries, and a contact form. Easy to customize and deploy. Ideal for designers, photographers, and artists.',
    category: CATEGORIES[3],
    price: 29,
    tags: ['Portfolio', 'Creative', 'Freelancer', 'GSAP', 'Minimal'],
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'portfolio design',
    previewUrl: '#',
    techStack: ['HTML5', 'CSS3', 'JavaScript', 'GSAP'],
    createdAt: new Date('2023-09-20T09:00:00Z').toISOString(),
    author: 'AdminUser',
  },
  {
    id: 'template-pointmax',
    title: 'PointMax POS System',
    description: 'User-friendly Point of Sale system for retail businesses.',
    longDescription: 'PointMax is a responsive POS template designed for efficiency and ease of use. It includes inventory management, sales tracking, and customer management features. Suitable for small to medium-sized retail stores.',
    category: CATEGORIES[2],
    price: 99,
    tags: ['POS', 'Retail', 'Inventory', 'Vue.js', 'Firebase'],
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'pos system',
    techStack: ['Vue.js', 'Firebase', 'Vuetify'],
    createdAt: new Date('2024-01-10T12:00:00Z').toISOString(),
    author: 'AdminUser',
  },
];

export const getTemplateById = (id: string): Template | undefined => MOCK_TEMPLATES.find(t => t.id === id);
export const getTemplatesByCategory = (slug: string): Template[] => MOCK_TEMPLATES.filter(t => t.category.slug === slug);
