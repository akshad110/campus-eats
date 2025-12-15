import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t("howItWorksPage.backToHome")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative">
            <img
              src="/WhatsApp Image 2025-12-14 at 10.21.27 AM.jpeg"
              alt="TakeAway Logo"
              className="h-12 w-12 rounded-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wide">
            {t("howItWorksPage.title")}
          </h1>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <div className="space-y-6">
            {/* Introduction */}
            <div>
              <p className="text-base leading-7">
                {t("howItWorksPage.introduction")}
              </p>
            </div>

            {/* Section 1 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section1Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section1Para1")}
                </p>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section1Para2")}
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section2Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section2Para1")}
                </p>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section2Para2")}
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section3Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section3Para1")}
                </p>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section3Para2")}
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section4Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section4Para1")}
                </p>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section4Para2")}
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section5Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section5Para1")}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base leading-7">
                  <li><strong>{t("howItWorksPage.section5Status1")}</strong></li>
                  <li><strong>{t("howItWorksPage.section5Status2")}</strong></li>
                  <li><strong>{t("howItWorksPage.section5Status3")}</strong></li>
                  <li><strong>{t("howItWorksPage.section5Status4")}</strong></li>
                  <li><strong>{t("howItWorksPage.section5Status5")}</strong></li>
                </ul>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section5Para2")}
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section6Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section6Para1")}
                </p>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section6Para2")}
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section7Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section7Para1")}
                </p>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section7Para2")}
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section8Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section8Para1")}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base leading-7">
                  <li>{t("howItWorksPage.section8Item1")}</li>
                  <li>{t("howItWorksPage.section8Item2")}</li>
                  <li>{t("howItWorksPage.section8Item3")}</li>
                  <li>{t("howItWorksPage.section8Item4")}</li>
                  <li>{t("howItWorksPage.section8Item5")}</li>
                  <li>{t("howItWorksPage.section8Item6")}</li>
                </ul>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section8Para2")}
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section9Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section9Para1")}
                </p>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section9Para2")}
                </p>
              </div>
            </div>

            {/* Section 10 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("howItWorksPage.section10Title")}
              </h2>
              <div className="space-y-4">
                <p className="text-base leading-7">
                  {t("howItWorksPage.section10Para1")}
                </p>
                <p className="text-base leading-7">
                  {t("howItWorksPage.section10Para2")}
                </p>
              </div>
            </div>

            {/* Closing */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-base leading-7 text-gray-600">
                {t("howItWorksPage.closing")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

