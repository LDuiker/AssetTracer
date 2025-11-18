import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPostBySlug, getAllPosts } from '@/lib/blog-posts';
import { Badge } from '@/components/ui/badge';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found - Asset Tracer Blog',
    };
  }

  return {
    title: `${post.title} - Asset Tracer Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.asset-tracer.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      images: post.image ? [`https://www.asset-tracer.com${post.image}`] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Parse markdown-style content (simple version)
  const contentSections = post.content
    .split('\n')
    .map(line => line.trim())
    .filter((line, index, arr) => {
      // Keep empty lines that are horizontal rules
      if (line === '---') return true;
      // Remove empty lines but keep structure
      if (line === '') {
        // Keep if it's between list items or after headings
        const prev = arr[index - 1];
        const next = arr[index + 1];
        if (prev && (prev.startsWith('- ') || prev.startsWith('* ') || prev.startsWith('#'))) {
          return false; // Remove empty lines after lists/headings
        }
        return false;
      }
      return true;
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="flex items-center space-x-2 text-gray-900 hover:text-[#2563EB] transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Blog</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="text-[#2563EB] border-[#2563EB]">
                {post.category}
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {post.readTime}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            
            {post.description && (
              <p className="text-xl text-gray-600 mb-6">
                {post.description}
              </p>
            )}

            {post.author && (
              <p className="text-sm text-gray-500 mb-6">
                By {post.author}
              </p>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              {contentSections.map((section, index) => {
                // Handle horizontal rules
                if (section === '---' || section.startsWith('---')) {
                  return (
                    <hr key={index} className="my-8 border-gray-200" />
                  );
                }
                // Handle main headings
                if (section.startsWith('# ')) {
                  return (
                    <h1 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
                      {section.replace('# ', '').replace(/\*\*/g, '')}
                    </h1>
                  );
                }
                // Handle subheadings
                if (section.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-3">
                      {section.replace('## ', '').replace(/\*\*/g, '')}
                    </h2>
                  );
                }
                // Handle sub-subheadings
                if (section.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                      {section.replace('### ', '').replace(/\*\*/g, '')}
                    </h3>
                  );
                }
                // Handle bold text (standalone)
                if (section.startsWith('**') && section.endsWith('**') && section.split('**').length === 3) {
                  return (
                    <p key={index} className="font-semibold text-gray-900 mt-4 mb-2">
                      {section.replace(/\*\*/g, '')}
                    </p>
                  );
                }
                // Handle list items
                if (section.startsWith('- ') || section.startsWith('* ')) {
                  const bullet = section.startsWith('- ') ? '- ' : '* ';
                  const content = section.replace(bullet, '');
                  // Handle checkmarks
                  if (content.startsWith('✔')) {
                    return (
                      <li key={index} className="ml-4 mb-2 text-gray-700 flex items-start">
                        <span className="text-green-600 mr-2">✔</span>
                        <span>{content.replace('✔', '').trim()}</span>
                      </li>
                    );
                  }
                  return (
                    <li key={index} className="ml-4 mb-2 text-gray-700">
                      {content}
                    </li>
                  );
                }
                // Handle empty lines
                if (section.trim() === '') {
                  return null;
                }
                
                // Handle regular paragraphs with inline formatting
                const processedText = section
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>');
                
                return (
                  <p 
                    key={index} 
                    className="text-gray-700 mb-4 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processedText }}
                  />
                );
              })}
            </div>
          </div>
        </article>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

