import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

function Footer() {
  return (
    <footer className="w-full bg-somig text-chblack py-10 font-quick border-t-2 border-chgrey/10">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-10 sm:gap-6">
          <div className="w-full sm:w-1/3">
            <h2 className="text-pink-600 font-bnt text-2xl mb-3">HOBBYHIVE</h2>
            <p className="text-chblack/70 w-full sm:w-5/6">
              A social feed for people who do one hobby, really well. Pick yours, and that&apos;s
              what you see.
            </p>
          </div>

          <div className="w-full sm:w-1/4">
            <h2 className="font-semibold mb-3">Quick Links</h2>
            <ul className="space-y-2 text-chblack/70">
              <li>
                <a href="#" className="hover:text-chblack transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-chblack transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-chblack transition-colors">
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-chblack transition-colors">
                  FAQ
                </a>
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
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <span className="w-10 h-10 bg-white text-chblack/70 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                  <FaTwitter size="1.1rem" />
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

        <div className="mt-8 pt-5 border-t border-chblack/10">
          <p className="text-chblack/50 text-sm">&copy; {new Date().getFullYear()} HobbyHive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
