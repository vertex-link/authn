/**
 * Author repository for Deno KV operations
 */

import type { Author, AuthorCreate, AuthorUpdate } from "@types/Author.ts";
import { generateId, getKv, KV_KEYS } from "./kv.ts";

export class AuthorRepository {
  /**
   * Create a new author
   */
  async create(data: AuthorCreate): Promise<Author> {
    const kv = getKv();
    const id = generateId();
    const now = new Date();

    const author: Author = {
      id,
      userId: data.userId,
      displayName: data.displayName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      website: data.website,
      socialLinks: data.socialLinks,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
      projectCount: 0,
      metadata: data.metadata,
    };

    // Use atomic operation to ensure user doesn't already have an author profile
    const result = await kv.atomic()
      .check({ key: KV_KEYS.AUTHOR_BY_USER(data.userId), versionstamp: null })
      .set(KV_KEYS.AUTHOR_BY_ID(id), author)
      .set(KV_KEYS.AUTHOR_BY_USER(data.userId), id)
      .commit();

    if (!result.ok) {
      throw new Error("User already has an author profile");
    }

    return author;
  }

  /**
   * Find author by ID
   */
  async findById(id: string): Promise<Author | null> {
    const kv = getKv();
    const result = await kv.get<Author>(KV_KEYS.AUTHOR_BY_ID(id));
    return result.value;
  }

  /**
   * Find author by user ID
   */
  async findByUserId(userId: string): Promise<Author | null> {
    const kv = getKv();

    // First get the author ID from the user index
    const idResult = await kv.get<string>(KV_KEYS.AUTHOR_BY_USER(userId));
    if (!idResult.value) {
      return null;
    }

    // Then get the author by ID
    return this.findById(idResult.value);
  }

  /**
   * Update author
   */
  async update(id: string, data: AuthorUpdate): Promise<Author | null> {
    const kv = getKv();

    // Get current author
    const currentAuthor = await this.findById(id);
    if (!currentAuthor) {
      return null;
    }

    const updatedAuthor: Author = {
      ...currentAuthor,
      ...data,
      updatedAt: new Date(),
    };

    // Update social links if provided
    if (data.socialLinks) {
      updatedAuthor.socialLinks = {
        ...currentAuthor.socialLinks,
        ...data.socialLinks,
      };
    }

    await kv.set(KV_KEYS.AUTHOR_BY_ID(id), updatedAuthor);

    return updatedAuthor;
  }

  /**
   * Increment project count
   */
  async incrementProjectCount(id: string): Promise<void> {
    const kv = getKv();
    const author = await this.findById(id);
    if (!author) {
      return;
    }

    author.projectCount++;
    author.updatedAt = new Date();
    await kv.set(KV_KEYS.AUTHOR_BY_ID(id), author);
  }

  /**
   * Decrement project count
   */
  async decrementProjectCount(id: string): Promise<void> {
    const kv = getKv();
    const author = await this.findById(id);
    if (!author) {
      return;
    }

    author.projectCount = Math.max(0, author.projectCount - 1);
    author.updatedAt = new Date();
    await kv.set(KV_KEYS.AUTHOR_BY_ID(id), author);
  }

  /**
   * Set verified status
   */
  async setVerified(id: string, isVerified: boolean): Promise<Author | null> {
    const kv = getKv();
    const author = await this.findById(id);
    if (!author) {
      return null;
    }

    author.isVerified = isVerified;
    author.updatedAt = new Date();
    await kv.set(KV_KEYS.AUTHOR_BY_ID(id), author);

    return author;
  }

  /**
   * Delete author
   */
  async delete(id: string): Promise<boolean> {
    const kv = getKv();
    const author = await this.findById(id);
    if (!author) {
      return false;
    }

    await kv.atomic()
      .delete(KV_KEYS.AUTHOR_BY_ID(id))
      .delete(KV_KEYS.AUTHOR_BY_USER(author.userId))
      .commit();

    return true;
  }

  /**
   * List all authors (with pagination)
   */
  async list(limit = 50, cursor?: string): Promise<{ authors: Author[]; cursor?: string }> {
    const kv = getKv();
    const authors: Author[] = [];

    const iter = kv.list<Author>({ prefix: KV_KEYS.AUTHORS }, { limit, cursor });

    for await (const entry of iter) {
      authors.push(entry.value);
    }

    return {
      authors,
      cursor: iter.cursor,
    };
  }
}

// Export singleton instance
export const authorRepository = new AuthorRepository();
