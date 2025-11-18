/**
 * Author/Creator types for managing content creators
 */

export interface SocialLinks {
  twitter?: string;
  github?: string;
  website?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  [key: string]: string | undefined;
}

export interface Author {
  id: string; // UUID
  userId: string; // Link to User
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  socialLinks?: SocialLinks;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
  metadata?: Record<string, unknown>;
}

export interface AuthorCreate {
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  socialLinks?: SocialLinks;
  metadata?: Record<string, unknown>;
}

export interface AuthorUpdate {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  socialLinks?: Partial<SocialLinks>;
  metadata?: Record<string, unknown>;
}

export interface PublicAuthor {
  id: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  socialLinks?: SocialLinks;
  isVerified: boolean;
  createdAt: Date;
  projectCount: number;
}

// Helper to convert Author to PublicAuthor
export function toPublicAuthor(author: Author): PublicAuthor {
  return {
    id: author.id,
    displayName: author.displayName,
    bio: author.bio,
    avatarUrl: author.avatarUrl,
    website: author.website,
    socialLinks: author.socialLinks,
    isVerified: author.isVerified,
    createdAt: author.createdAt,
    projectCount: author.projectCount,
  };
}
