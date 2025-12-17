import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, Settings, Shield, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const CookiePolicy = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t("cookiePolicy.title")}
            </h1>
          </div>
          <p className="text-gray-600">
            {t("cookiePolicy.lastUpdated")}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Cookie className="h-5 w-5 text-orange-600" />
                {t("cookiePolicy.whatAreCookies")}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("cookiePolicy.cookiesDesc1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("cookiePolicy.cookiesDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-600" />
                {t("cookiePolicy.typesOfCookies")}
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1. {t("cookiePolicy.essentialCookies")}</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    {t("cookiePolicy.essentialDesc")}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>{t("cookiePolicy.purpose")}:</strong> {t("cookiePolicy.essentialPurpose")}</li>
                    <li><strong>{t("cookiePolicy.duration")}:</strong> {t("cookiePolicy.essentialDuration")}</li>
                    <li><strong>{t("cookiePolicy.canYouDisable")}?</strong> {t("cookiePolicy.essentialDisable")}</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2. {t("cookiePolicy.performanceCookies")}</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    {t("cookiePolicy.performanceDesc")}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>{t("cookiePolicy.purpose")}:</strong> {t("cookiePolicy.performancePurpose")}</li>
                    <li><strong>{t("cookiePolicy.examples")}:</strong> {t("cookiePolicy.performanceExamples")}</li>
                    <li><strong>{t("cookiePolicy.canYouDisable")}?</strong> {t("cookiePolicy.performanceDisable")}</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3. {t("cookiePolicy.functionalityCookies")}</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    {t("cookiePolicy.functionalityDesc")}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>{t("cookiePolicy.purpose")}:</strong> {t("cookiePolicy.functionalityPurpose")}</li>
                    <li><strong>{t("cookiePolicy.examples")}:</strong> {t("cookiePolicy.functionalityExamples")}</li>
                    <li><strong>{t("cookiePolicy.canYouDisable")}?</strong> {t("cookiePolicy.functionalityDisable")}</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4. {t("cookiePolicy.marketingCookies")}</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    {t("cookiePolicy.marketingDesc")}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>{t("cookiePolicy.purpose")}:</strong> {t("cookiePolicy.marketingPurpose")}</li>
                    <li><strong>{t("cookiePolicy.examples")}:</strong> {t("cookiePolicy.marketingExamples")}</li>
                    <li><strong>{t("cookiePolicy.canYouDisable")}?</strong> {t("cookiePolicy.marketingDisable")}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                {t("cookiePolicy.thirdPartyCookies")}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("cookiePolicy.thirdPartyDesc1")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("cookiePolicy.thirdPartyList1")}</li>
                <li>{t("cookiePolicy.thirdPartyList2")}</li>
                <li>{t("cookiePolicy.thirdPartyList3")}</li>
                <li>{t("cookiePolicy.thirdPartyList4")}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                {t("cookiePolicy.thirdPartyDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                {t("cookiePolicy.managingCookies")}
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">{t("cookiePolicy.browserSettings")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("cookiePolicy.browserDesc1")}
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("cookiePolicy.browserDesc2")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Microsoft Edge</a></li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">{t("cookiePolicy.cookiePreferences")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("cookiePolicy.cookiePrefDesc")}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">{t("cookiePolicy.optOutLinks")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("cookiePolicy.optOutDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Google Analytics Opt-out</a></li>
                <li><strong>Advertising Networks:</strong> Visit <a href="http://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Your Online Choices</a> or <a href="http://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">AboutAds</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("cookiePolicy.doNotTrack")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("cookiePolicy.dntDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("cookiePolicy.cookieRetention")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("cookiePolicy.retentionDesc1")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("cookiePolicy.retentionList1")}</li>
                <li>{t("cookiePolicy.retentionList2")}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                {t("cookiePolicy.retentionDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("cookiePolicy.updatesToPolicy")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("cookiePolicy.updatesDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("cookiePolicy.contactUs")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("cookiePolicy.contactDesc")}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>{t("cookiePolicy.email")}:</strong> akshadvengurlekar35@gmail.com
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>{t("cookiePolicy.address")}:</strong> {t("cookiePolicy.addressValue")}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;

