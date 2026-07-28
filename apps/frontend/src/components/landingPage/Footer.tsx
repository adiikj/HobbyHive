import Link from "next/link";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Logo from "@/components/brand/Logo";

function Footer() {
  return (
    <footer className="w-full bg-somig text-chblack py-10 font-quick border-t-2 border-chgrey/10">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-10 sm:gap-6">
          <div className="w-full sm:w-1/3">
            <div className="flex items-center gap-2 mb-3">
              <Logo size={24} className="shrink-0" />
              <h2 className="text-pink-600 font-bnt text-2xl">HOBBYHIVE</h2>
            </div>
            <p className="text-chblack/70 w-full sm:w-5/6">
              A social feed for people who do one hobby, really well. Pick yours, and that&apos;s
              what you see.
            </p>
          </div>

          <div className="w-full sm:w-1/4">
            <h2 className="font-semibold mb-3">Quick Links</h2>
            <ul className="space-y-2 text-chblack/70">
              <li>
                <Link href="/" className="hover:text-chblack transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-chblack transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-chblack transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-chblack transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-chblack transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full sm:w-1/3">
            <h2 className="font-semibold mb-3">Contact</h2>
            <p className="text-chblack/70">
              <a href="mailto:contactus@hobbyhive.com" className="hover:text-chblack transition-colors">
                contactus@hobbyhive.com
              </a>
            </p>

            <div className="flex justify-start gap-3 mt-5">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <span className="w-10 h-10 bg-white text-chblack/70 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                  <FaFacebook size="1.1rem" />
                </span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X">
                <span className="w-10 h-10 bg-white text-chblack/70 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                  <FaXTwitter size="1.1rem" />
                </span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <span className="w-10 h-10 bg-white text-chblack/70 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                  <FaInstagram size="1.1rem" />
                </span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <span className="w-10 h-10 bg-white text-chblack/70 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                  <FaLinkedin size="1.1rem" />
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-chblack/10 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2">
          <p className="text-chblack/50 text-sm">&copy; {new Date().getFullYear()} HobbyHive. All rights reserved.</p>
          <p className="text-chblack/50 text-sm">
            Designed and developed by{" "}
            <a
              href="https://adiikj.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-chblack hover:text-pink-600 transition-colors"
            >
              Aditya
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
