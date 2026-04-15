"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";

interface BlogPostPageProps {
  blog: {
    _id: string;
    title: string;
    slug: string;
    content?: string;
    excerpt?: string;
    image?: string;
    author?: string;
    category?: string;
    tags: string[];
    createdAt: string;
  };
}

export default function BlogPostPage({ blog }: BlogPostPageProps) {
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (articleRef.current) {
      gsap.fromTo(
        articleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-[860px] mx-auto px-4 py-6 md:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs md:text-sm text-[#888] mb-6">
        <Link href="/" className="text-[#737530] hover:underline">Home</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-1.5 opacity-50">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <Link href="/blog" className="text-[#737530] hover:underline">Blog</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-1.5 opacity-50">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-[#1C2120] font-medium truncate max-w-[200px]">{blog.title}</span>
      </nav>

      <article ref={articleRef}>
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1C2120] leading-tight">
            {blog.title}
          </h1>

          <div className="flex items-center gap-3 mt-4 text-sm text-[#888]">
            {blog.author && <span>By <span className="text-[#737530] font-medium">{blog.author}</span></span>}
            <span>&bull;</span>
            <time dateTime={blog.createdAt}>{formattedDate}</time>
            {blog.category && (
              <>
                <span>&bull;</span>
                <span className="text-[#737530]">{blog.category}</span>
              </>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {blog.image && (
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-8">
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              className="object-cover"
              sizes="(max-width: 860px) 100vw, 860px"
              priority
            />
          </div>
        )}

        {/* Content — admin-authored from CMS, not user-generated */}
        {blog.content && (
          <div
            className="prose prose-lg max-w-none text-[#464646] leading-relaxed
              prose-headings:text-[#1C2120] prose-headings:font-semibold
              prose-a:text-[#737530] prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:mx-auto
              prose-blockquote:border-l-[#737530] prose-blockquote:text-[#464646]"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        )}

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-10 pt-6 border-t border-gray-100">
            <span className="text-sm font-medium text-[#1C2120]">Tags:</span>
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium bg-[#f5f7fa] text-[#464646] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
