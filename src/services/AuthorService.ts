/**
 * Author management service
 */

import type { Author, AuthorCreate, AuthorUpdate, PublicAuthor } from "@types/Author.ts";
import { toPublicAuthor } from "@types/Author.ts";
import { authorRepository } from "@db/AuthorRepository.ts";
import { userRepository } from "@db/UserRepository.ts";

export class AuthorService {
  /**
   * Create author profile for a user
   */
  async createAuthor(data: AuthorCreate): Promise<PublicAuthor> {
    // Verify user exists
    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has an author profile
    const existing = await authorRepository.findByUserId(data.userId);
    if (existing) {
      throw new Error("User already has an author profile");
    }

    const author = await authorRepository.create(data);
    return toPublicAuthor(author);
  }

  /**
   * Get author by ID
   */
  async getAuthor(id: string): Promise<PublicAuthor | null> {
    const author = await authorRepository.findById(id);
    if (!author) {
      return null;
    }
    return toPublicAuthor(author);
  }

  /**
   * Get author by user ID
   */
  async getAuthorByUserId(userId: string): Promise<PublicAuthor | null> {
    const author = await authorRepository.findByUserId(userId);
    if (!author) {
      return null;
    }
    return toPublicAuthor(author);
  }

  /**
   * Update author profile
   */
  async updateAuthor(id: string, data: AuthorUpdate): Promise<PublicAuthor | null> {
    const author = await authorRepository.update(id, data);
    if (!author) {
      return null;
    }
    return toPublicAuthor(author);
  }

  /**
   * Delete author profile
   */
  async deleteAuthor(id: string): Promise<boolean> {
    return await authorRepository.delete(id);
  }

  /**
   * Verify author
   */
  async verifyAuthor(id: string): Promise<PublicAuthor | null> {
    const author = await authorRepository.setVerified(id, true);
    if (!author) {
      return null;
    }
    return toPublicAuthor(author);
  }

  /**
   * Unverify author
   */
  async unverifyAuthor(id: string): Promise<PublicAuthor | null> {
    const author = await authorRepository.setVerified(id, false);
    if (!author) {
      return null;
    }
    return toPublicAuthor(author);
  }

  /**
   * Increment project count
   */
  async incrementProjectCount(id: string): Promise<void> {
    await authorRepository.incrementProjectCount(id);
  }

  /**
   * Decrement project count
   */
  async decrementProjectCount(id: string): Promise<void> {
    await authorRepository.decrementProjectCount(id);
  }

  /**
   * List all authors (with pagination)
   */
  async listAuthors(limit = 50, cursor?: string): Promise<{
    authors: PublicAuthor[];
    cursor?: string;
  }> {
    const result = await authorRepository.list(limit, cursor);
    return {
      authors: result.authors.map(toPublicAuthor),
      cursor: result.cursor,
    };
  }

  /**
   * Get author with user info
   */
  async getAuthorWithUser(id: string): Promise<{
    author: PublicAuthor;
    user: {
      id: string;
      username: string;
      email: string;
    };
  } | null> {
    const author = await authorRepository.findById(id);
    if (!author) {
      return null;
    }

    const user = await userRepository.findById(author.userId);
    if (!user) {
      return null;
    }

    return {
      author: toPublicAuthor(author),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }
}

// Export singleton instance
export const authorService = new AuthorService();
