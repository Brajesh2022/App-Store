'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Download, Star, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface App {
  title: string;
  url: string;
  icon: string;
  subtitle?: string;
  rating: number;
}

interface AppDetails {
  title: string;
  publisher: string;
  icon: string;
  modFeature: string;
  rating: number;
  version: string;
  size: string;
  requires: string;
  screenshots: string[];
  about: string;
  downloadUrl: string;
  playStoreUrl?: string;
  details: { [key: string]: string };
}

interface Review {
  author: string;
  authorImg: string;
  date: string;
  rating: number;
  text: string;
  helpful?: string;
  devReply?: {
    author: string;
    text: string;
  };
}

interface DownloadLink {
  title: string;
  href: string;
  description: string;
  version?: string;
  isMod: boolean;
  isOriginal: boolean;
  additionalInfo?: string;
}

type View = 'home' | 'search' | 'app';

export default function AppStore() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<App[]>([]);
  const [homeData, setHomeData] = useState<{ [key: string]: App[] }>({});
  const [currentApp, setCurrentApp] = useState<AppDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [homeLoading, setHomeLoading] = useState(true);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [fromView, setFromView] = useState<'home' | 'search'>('home');
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Load homepage data with faster loading
  useEffect(() => {
    loadHomepage();
  }, []);

  const loadHomepage = async () => {
    setHomeLoading(true);
    const apiUrl = `https://vlyx-scrapping.vercel.app/api/index?url=${encodeURIComponent('https://apkmody.com/')}`;
    
    try {
      const response = await fetch(apiUrl);
      const htmlSource = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSource, "text/html");
      
      const sections = doc.querySelectorAll('main#primary > section');
      const homeData: { [key: string]: App[] } = {};
      
      // Process sections in parallel for faster loading
      const sectionPromises = Array.from(sections).map(async (section) => {
        const h2 = section.querySelector('h2');
        const items = section.querySelectorAll('article.flex-item a.app, div.flex-item article.card a');
        
        if (h2 && items.length > 0) {
          const title = h2.textContent?.trim() || '';
          const apps: App[] = [];
          
          items.forEach(item => {
            const url = (item as HTMLAnchorElement).href;
            const appTitle = item.querySelector("h3")?.textContent?.trim() || "Unknown";
            const icon = (item.querySelector("img") as HTMLImageElement)?.src || "";
            const ratingContainer = item.querySelector(".app-rating, .card-rating");
            const ratingStars = ratingContainer ? ratingContainer.querySelectorAll(".star.active").length : 0;
            
            apps.push({
              title: appTitle,
              url,
              icon,
              rating: ratingStars
            });
          });
          
          return { title, apps };
        }
        return null;
      });
      
      const results = await Promise.all(sectionPromises);
      results.forEach(result => {
        if (result) {
          homeData[result.title] = result.apps;
        }
      });
      
      setHomeData(homeData);
    } catch (error) {
      console.error('Error loading homepage:', error);
    } finally {
      setHomeLoading(false);
    }
  };

  const searchApps = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setCurrentView('search');
    setSearchExpanded(false);
    
    const apkmodyUrl = `https://apkmody.com/?s=${encodeURIComponent(searchQuery)}`;
    const apiUrl = `https://vlyx-scrapping.vercel.app/api/index?url=${encodeURIComponent(apkmodyUrl)}`;
    
    try {
      const response = await fetch(apiUrl);
      const htmlSource = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSource, "text/html");
      
      const items = doc.querySelectorAll("main#primary section div.flex-container article.flex-item a.app");
      const results: App[] = [];
      
      items.forEach((item) => {
        const title = item.querySelector("h2.font-size__normal")?.textContent?.trim() || "Unknown Title";
        const url = (item as HTMLAnchorElement).href;
        const icon = (item.querySelector("img") as HTMLImageElement)?.src || "";
        const subtitle = item.querySelector(".app-sub-text")?.textContent?.trim().replace(/\s+/g, ' ') || "";
        const ratingStars = item.querySelectorAll(".app-rating .star.active").length;
        
        results.push({
          title,
          url,
          icon,
          subtitle,
          rating: ratingStars
        });
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching apps:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAppPage = async (url: string, from: 'home' | 'search' = 'home') => {
    setLoading(true);
    setFromView(from);
    setCurrentView('app');
    window.scrollTo(0, 0);
    
    const apiUrl = `https://vlyx-scrapping.vercel.app/api/index?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(apiUrl);
      const htmlSource = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSource, "text/html");
      
      const title = doc.querySelector("h1.font-size__medium strong")?.textContent?.trim() || "App";
      const publisher = doc.querySelector(".app.app__large .app-name span a")?.textContent?.trim() || "Unknown";
      const icon = (doc.querySelector(".app.app__large .app-icon img") as HTMLImageElement)?.src || "";
      const modFeature = findTableData(doc, "MOD Features") || "Standard Version";
      const ratingStars = doc.querySelectorAll("#app-info .rating .star.active").length;
      const version = findTableData(doc, "Version") || "N/A";
      const size = findTableData(doc, "Size") || "N/A";
      const requires = findTableData(doc, "Requires") || "N/A";
      const playStoreUrl = findTableData(doc, "Google Play ID", true);
      
      const screenshotElements = doc.querySelectorAll(".screenshots a.screenshot");
      const screenshots: string[] = [];
      screenshotElements.forEach(a => {
        const fullResUrl = (a as HTMLAnchorElement).dataset.src || (a as HTMLAnchorElement).href;
        screenshots.push(fullResUrl);
      });
      
      const about = doc.querySelector(".main-entry-content > p")?.textContent?.trim() || "No description available.";
      const downloadButton = doc.querySelector("#main-download-button");
      const downloadUrl = downloadButton ? atob((downloadButton as HTMLElement).dataset.href || '') : '#';
      
      // Parse app details
      const details: { [key: string]: string } = {};
      const skipLabels = ["MOD Features", "Rating Score", "Version", "Size", "Requires", "Google Play ID"];
      const tableRows = doc.querySelectorAll("#app-info table tr");
      let lastLabel: string | null = null;
      
      tableRows.forEach(row => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        let currentLabel: string | null = null;
        let currentValue: string | null = null;
        
        if (th && td) {
          currentLabel = th.textContent?.trim() || null;
          currentValue = td.innerHTML;
          lastLabel = null;
        } else if (th) {
          lastLabel = th.textContent?.trim() || null;
        } else if (td && lastLabel) {
          currentLabel = lastLabel;
          currentValue = td.innerHTML;
          lastLabel = null;
        }
        
        if (currentLabel && currentValue && !skipLabels.includes(currentLabel)) {
          details[currentLabel] = currentValue;
        }
      });
      
      const appDetails: AppDetails = {
        title,
        publisher,
        icon,
        modFeature,
        rating: ratingStars,
        version,
        size,
        requires,
        screenshots,
        about,
        downloadUrl,
        playStoreUrl,
        details
      };
      
      setCurrentApp(appDetails);
      
      // Load reviews if Play Store URL exists
      if (playStoreUrl) {
        loadPlayStoreReviews(playStoreUrl);
      } else {
        setReviews([]);
      }
      
    } catch (error) {
      console.error('Error loading app page:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayStoreReviews = async (playStoreUrl: string) => {
    const apiUrl = `https://vlyx-scrapping.vercel.app/api/index?url=${encodeURIComponent(playStoreUrl)}`;
    
    try {
      const response = await fetch(apiUrl);
      const htmlSource = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSource, "text/html");
      
      const reviewBlocks = doc.querySelectorAll('div[data-g-id="reviews"] .EGFGHd');
      const reviewsData: Review[] = [];
      
      reviewBlocks.forEach(block => {
        const author = block.querySelector('.X5PpBb')?.textContent?.trim() || "Unknown User";
        const authorImg = (block.querySelector('.abYEib') as HTMLImageElement)?.src || "";
        const date = block.querySelector('.bp9Aid')?.textContent?.trim() || "";
        const reviewText = block.querySelector('.h3YV2d')?.textContent?.trim() || "";
        const helpfulCount = block.querySelector('.AJTPZc')?.textContent?.trim() || "";
        
        const ratingLabel = block.querySelector('.iXRFPc')?.getAttribute('aria-label') || "";
        const starsMatch = ratingLabel.match(/Rated (\d)/);
        const starCount = starsMatch ? parseInt(starsMatch[1], 10) : 0;
        
        let devReply;
        const replyBlock = block.querySelector('.ocpBU');
        if (replyBlock) {
          const devName = replyBlock.querySelector('.I6j64d')?.textContent?.trim() || "Developer";
          const replyBody = replyBlock.querySelector('.ras4vb')?.textContent?.trim() || "";
          devReply = { author: devName, text: replyBody };
        }
        
        if (reviewText) {
          reviewsData.push({
            author,
            authorImg,
            date,
            rating: starCount,
            text: reviewText,
            helpful: helpfulCount,
            devReply
          });
        }
      });
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    }
  };

  const openDownloadModal = async (downloadPageUrl: string) => {
    setDownloadModalOpen(true);
    setDownloadLoading(true);
    
    const apiUrl = `https://vlyx-scrapping.vercel.app/api/index?url=${encodeURIComponent(downloadPageUrl)}`;
    
    try {
      const response = await fetch(apiUrl);
      const htmlSource = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSource, "text/html");
      
      // EXACT SAME LOGIC AS YOUR PROTOTYPE - Find both <details> and <a> tags
      const items = doc.querySelectorAll(".download-list > details, .download-list > a.clickable");
      
      if (items.length === 0) {
        setDownloadLinks([]);
        setDownloadLoading(false);
        return;
      }

      const validLinks: DownloadLink[] = [];

      items.forEach(item => {
        let title, tagsDiv, href;
        const nodeName = item.tagName.toUpperCase();

        let primaryLink;
        if (nodeName === 'A') {
          primaryLink = (item as HTMLAnchorElement).href;
        } else if (nodeName === 'DETAILS') {
          primaryLink = (item.querySelector('a.button') as HTMLAnchorElement)?.href || 
                       (item.querySelector('a') as HTMLAnchorElement)?.href;
        }

        // AD FILTER: Check hostname of the link - only allow apkmody.com
        if (!primaryLink) return;
        
        try {
          const linkUrl = new URL(primaryLink);
          if (linkUrl.hostname !== "apkmody.com") {
            return; // This is an ad link (like ldplayer) or invalid, skip it.
          }
        } catch {
          return; // Invalid URL
        }
        
        if (nodeName === 'A') {
          // This is a simple link item (like Original APK)
          title = item.querySelector(".color__blue")?.textContent?.trim();
          tagsDiv = item.querySelector(".color__gray");
          href = (item as HTMLAnchorElement).href;
        } else if (nodeName === 'DETAILS') {
          // This is a complex item (like YouTube Music's MOD)
          const summary = item.querySelector('summary');
          title = summary?.querySelector(".color__blue")?.textContent?.trim();
          tagsDiv = summary?.querySelector(".color__gray");
          // The actual download link is the button inside the body
          href = (item.querySelector("a.button.button__blue") as HTMLAnchorElement)?.href;
        }

        // If we successfully parsed a valid item, add it to the modal
        if (title && tagsDiv && href) {
          const rawText = tagsDiv.textContent?.toLowerCase() || '';
          const isMod = rawText.includes("mod") || rawText.includes("unlocked") || rawText.includes("premium");
          const isOriginal = rawText.includes("original") || (!isMod && rawText.includes("apk"));
          
          // Extract version from title
          const versionMatch = title.match(/v(\d+\.[\d\.]+)/);
          const version = versionMatch ? versionMatch[1] : null;
          
          validLinks.push({
            title,
            href,
            description: tagsDiv.textContent?.trim() || '',
            version,
            isMod,
            isOriginal
          });
        }
      });
      
      // Sort: MOD versions first, then by version number descending
      validLinks.sort((a, b) => {
        if (a.isMod && !b.isMod) return -1;
        if (!a.isMod && b.isMod) return 1;
        
        if (a.version && b.version) {
          const aVersion = a.version.split('.').map(n => parseInt(n) || 0);
          const bVersion = b.version.split('.').map(n => parseInt(n) || 0);
          
          for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
            const aNum = aVersion[i] || 0;
            const bNum = bVersion[i] || 0;
            if (aNum !== bNum) return bNum - aNum;
          }
        }
        
        return 0;
      });
      
      setDownloadLinks(validLinks);
      
    } catch (error) {
      console.error('Error loading download links:', error);
      setDownloadLinks([]);
    } finally {
      setDownloadLoading(false);
    }
  };

  const fetchFinalLink = async (bufferUrl: string) => {
    const apiUrl = `https://vlyx-scrapping.vercel.app/api/index?url=${encodeURIComponent(bufferUrl)}`;
    
    try {
      const response = await fetch(apiUrl);
      const htmlSource = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSource, "text/html");
      
      let targetElement = doc.getElementById("d-button");
      if (!targetElement) {
        targetElement = doc.querySelector("#main-download-button[data-href]");
      }
      
      if (targetElement) {
        const encodedData = targetElement.getAttribute("data-href");
        if (encodedData) {
          const finalFileUrl = atob(encodedData);
          window.open(finalFileUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error fetching final download link:', error);
    }
  };

  const findTableData = (doc: Document, label: string, getHref = false): string | null => {
    try {
      const ths = doc.querySelectorAll("#app-info th");
      const foundTh = Array.from(ths).find(
        (th) => th.textContent?.trim().toLowerCase() === label.toLowerCase()
      );
      if (foundTh) {
        const td = foundTh.nextElementSibling;
        if (getHref) {
          const anchor = td?.querySelector('a');
          return anchor ? (anchor as HTMLAnchorElement).href : (td?.textContent?.trim() || null);
        }
        return td?.textContent?.trim() || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const goBack = () => {
    if (fromView === 'search') {
      setCurrentView('search');
    } else {
      setCurrentView('home');
    }
    setCurrentApp(null);
    setReviews([]);
  };

  const showHome = () => {
    setCurrentView('home');
    setCurrentApp(null);
    setReviews([]);
    setSearchQuery('');
    setSearchResults([]);
    setSearchExpanded(false);
  };

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
    if (!searchExpanded) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header with Full-Width Search */}
      <header className="sticky top-0 z-50 liquid-header">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {!searchExpanded ? (
            <div className="flex items-center justify-between">
              <h1 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer floating"
                onClick={showHome}
              >
                App Store
              </h1>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSearch}
                className="liquid-glass rounded-full w-10 h-10"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 slide-in-search w-full">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  id="search-input"
                  placeholder="Search for games or apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchApps()}
                  className="pl-12 pr-4 h-12 liquid-glass border-0 text-lg"
                />
              </div>
              <Button onClick={searchApps} className="liquid-glass bg-blue-500/80 hover:bg-blue-600/80 text-white h-12 px-6">
                Search
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSearch}
                className="liquid-glass rounded-full w-12 h-12"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Home View */}
        {currentView === 'home' && (
          <div className="space-y-8">
            {homeLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-4">
                    <Skeleton className="h-7 w-48" />
                    <div className="flex gap-4 overflow-hidden">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 space-y-3">
                          <Skeleton className="h-28 w-28 rounded-2xl" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              Object.entries(homeData).map(([sectionTitle, apps], sectionIndex) => (
                <div key={sectionTitle}>
                  <section className="space-y-6 fade-in" style={{ animationDelay: `${sectionIndex * 0.1}s` }}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-foreground">{sectionTitle}</h2>
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                    
                    <div className="relative">
                      <div className="flex gap-4 overflow-x-auto scroll-container pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {apps.map((app, index) => (
                          <div 
                            key={index}
                            className={`flex-shrink-0 w-32 cursor-pointer app-card-hover stagger-item`}
                            onClick={() => loadAppPage(app.url, 'home')}
                          >
                            <div className="liquid-card rounded-2xl overflow-hidden">
                              <div className="p-3">
                                <div className="relative mb-3">
                                  <img 
                                    src={app.icon} 
                                    alt={app.title}
                                    className="w-full h-24 object-cover rounded-xl shadow-lg"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <h4 className="text-sm font-semibold truncate text-foreground mb-1">{app.title}</h4>
                                <div className="flex items-center gap-1">
                                  {renderStars(app.rating)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                  
                  {/* Compact Category Separator */}
                  {sectionIndex < Object.entries(homeData).length - 1 && (
                    <div className="flex items-center justify-center py-3">
                      <div className="w-12 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent dark:via-foreground/30"></div>
                      <div className="px-2">
                        <div className="w-1 h-1 rounded-full bg-foreground/30 dark:bg-foreground/40"></div>
                      </div>
                      <div className="w-12 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent dark:via-foreground/30"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Search View */}
        {currentView === 'search' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Search Results</h2>
              <Badge variant="secondary" className="liquid-glass">
                &quot;{searchQuery}&quot;
              </Badge>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="liquid-card rounded-2xl p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="liquid-card rounded-2xl p-12 text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No results found</h3>
                  <p className="text-muted-foreground">Try searching with different keywords</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((app, index) => (
                  <div 
                    key={index}
                    className="liquid-card rounded-2xl cursor-pointer hover:bg-accent/50 transition-all duration-300 app-card-hover stagger-item"
                    onClick={() => loadAppPage(app.url, 'search')}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={app.icon} 
                            alt={app.title}
                            className="w-16 h-16 object-cover rounded-xl shadow-md"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent to-black/10" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate text-foreground">{app.title}</h4>
                          {app.subtitle && (
                            <p className="text-sm text-muted-foreground truncate mt-1">{app.subtitle}</p>
                          )}
                          <div className="flex items-center gap-1 mt-2">
                            {renderStars(app.rating)}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* App View - Mobile-First Design Without Boxes */}
        {currentView === 'app' && (
          <div className="space-y-0 fade-in">
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="mb-6 liquid-glass rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {loading ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-20 w-20 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
                <Skeleton className="h-14 w-full rounded-2xl" />
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              </div>
            ) : currentApp && (
              <div className="space-y-8">
                {/* App Header - No Box */}
                <div className="flex items-start gap-4 px-2">
                  <div className="relative">
                    <img 
                      src={currentApp.icon} 
                      alt={currentApp.title}
                      className="w-20 h-20 object-cover rounded-2xl shadow-lg"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-black/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-bold truncate text-foreground">{currentApp.title}</h2>
                    <h3 className="text-lg text-blue-600 dark:text-blue-400 font-semibold mt-1">{currentApp.publisher}</h3>
                    <Badge className="mt-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0">
                      {currentApp.modFeature}
                    </Badge>
                  </div>
                </div>

                {/* Download Button - Prominent */}
                <Button 
                  className="w-full h-16 text-lg font-bold pulse-glow bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-lg rounded-2xl"
                  onClick={() => openDownloadModal(currentApp.downloadUrl)}
                >
                  <Download className="w-6 h-6 mr-3" />
                  Download Now
                </Button>

                {/* App Meta - Inline Grid */}
                <div className="grid grid-cols-4 gap-3 px-2">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-2 tracking-wider">Rating</div>
                    <div className="flex justify-center gap-1">
                      {renderStars(currentApp.rating)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-2 tracking-wider">Version</div>
                    <div className="font-bold text-foreground text-sm">{currentApp.version}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-2 tracking-wider">Size</div>
                    <div className="font-bold text-foreground text-sm">{currentApp.size}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-2 tracking-wider">Android</div>
                    <div className="font-bold text-foreground text-sm">{currentApp.requires}</div>
                  </div>
                </div>

                {/* Screenshots - Full Width */}
                {currentApp.screenshots.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold px-2 text-foreground">Screenshots</h3>
                    <div className="flex gap-4 overflow-x-auto scroll-container pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {currentApp.screenshots.map((screenshot, index) => (
                        <div key={index} className="flex-shrink-0">
                          <img
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            className="h-64 rounded-2xl object-cover cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg"
                            onClick={() => window.open(screenshot, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* About - Full Width */}
                <div className="space-y-4 px-2">
                  <h3 className="text-xl font-bold text-foreground">About this app</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">{currentApp.about}</p>
                </div>

                {/* App Details - Clean List */}
                {Object.keys(currentApp.details).length > 0 && (
                  <div className="space-y-4 px-2">
                    <h3 className="text-xl font-bold text-foreground">App Details</h3>
                    <div className="space-y-4">
                      {Object.entries(currentApp.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                          <span className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">{key}</span>
                          <span className="text-right max-w-[60%] text-foreground font-medium" dangerouslySetInnerHTML={{ __html: value }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews - Clean List */}
                <div className="space-y-6 px-2">
                  <h3 className="text-xl font-bold text-foreground">Reviews from Google Play</h3>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                        <Star className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No reviews available at the moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.slice(0, 5).map((review, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                          <div className="flex items-start gap-3 mb-3">
                            <img 
                              src={review.authorImg} 
                              alt={review.author}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="font-bold text-foreground">{review.author}</div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <div className="flex gap-1">
                                  {renderStars(review.rating)}
                                </div>
                                <span>•</span>
                                <span>{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed mb-3 text-foreground">{review.text}</p>
                          {review.helpful && (
                            <p className="text-xs text-muted-foreground">{review.helpful}</p>
                          )}
                          {review.devReply && (
                            <div className="mt-4 p-4 liquid-glass rounded-xl">
                              <div className="font-bold text-sm mb-2 text-blue-600 dark:text-blue-400">{review.devReply.author}</div>
                              <p className="text-sm text-foreground">{review.devReply.text}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Download Modal with Prototype Logic */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="liquid-glass border-0 max-w-md rounded-3xl overflow-hidden">
          {/* Modal Header with App Info */}
          {currentApp && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 p-6 -m-6 mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={currentApp.icon} 
                    alt={currentApp.title}
                    className="w-16 h-16 object-cover rounded-2xl shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-black/20" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate text-foreground">{currentApp.title}</h3>
                  <p className="text-sm text-muted-foreground">{currentApp.publisher}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs">
                      {currentApp.modFeature}
                    </Badge>
                    <span className="text-xs text-muted-foreground">• {currentApp.size}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Download className="w-5 h-5" />
              Available Downloads
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-80 overflow-y-auto">
            {downloadLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : downloadLinks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Download className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No valid download links found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {downloadLinks.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full h-auto p-4 justify-start liquid-glass border-0 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                      link.isMod 
                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-600/10 border-green-500/30 hover:from-green-500/20 hover:to-emerald-600/20' 
                        : link.isOriginal
                        ? 'bg-gradient-to-r from-blue-500/10 to-cyan-600/10 border-blue-500/30 hover:from-blue-500/20 hover:to-cyan-600/20'
                        : 'hover:bg-blue-500/10'
                    }`}
                    onClick={() => fetchFinalLink(link.href)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        link.isMod 
                          ? 'bg-green-500/20' 
                          : link.isOriginal 
                          ? 'bg-blue-500/20' 
                          : 'bg-gray-500/20'
                      }`}>
                        <Download className={`w-5 h-5 ${
                          link.isMod 
                            ? 'text-green-400' 
                            : link.isOriginal 
                            ? 'text-blue-400' 
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="text-left flex-1">
                        <div className={`font-bold text-base ${
                          link.isMod 
                            ? 'text-green-400' 
                            : link.isOriginal 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-foreground'
                        }`}>
                          {link.title}
                        </div>
                        {link.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {link.description}
                          </div>
                        )}
                        <div className="flex gap-1 mt-2">
                          {link.isMod && (
                            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                              MOD
                            </Badge>
                          )}
                          {link.isOriginal && (
                            <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Original
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
