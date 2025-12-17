import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Accessibility as AccessibilityIcon, Eye, MousePointerClick, Keyboard, Headphones, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const Accessibility = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AccessibilityIcon className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t("accessibility.title")}
            </h1>
          </div>
          <p className="text-gray-600">
            {t("accessibility.lastUpdated")}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.ourCommitment")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("accessibility.commitmentDesc1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("accessibility.commitmentDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {t("accessibility.accessibilityFeatures")}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <Eye className="h-6 w-6 text-orange-600 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t("accessibility.visualAccessibility")}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                    <li>{t("accessibility.visualList1")}</li>
                    <li>{t("accessibility.visualList2")}</li>
                    <li>{t("accessibility.visualList3")}</li>
                    <li>{t("accessibility.visualList4")}</li>
                    <li>{t("accessibility.visualList5")}</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <Keyboard className="h-6 w-6 text-orange-600 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t("accessibility.keyboardNavigation")}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                    <li>{t("accessibility.keyboardList1")}</li>
                    <li>{t("accessibility.keyboardList2")}</li>
                    <li>{t("accessibility.keyboardList3")}</li>
                    <li>{t("accessibility.keyboardList4")}</li>
                    <li>{t("accessibility.keyboardList5")}</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <MousePointerClick className="h-6 w-6 text-orange-600 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t("accessibility.interactiveElements")}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                    <li>{t("accessibility.interactiveList1")}</li>
                    <li>{t("accessibility.interactiveList2")}</li>
                    <li>{t("accessibility.interactiveList3")}</li>
                    <li>{t("accessibility.interactiveList4")}</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <Headphones className="h-6 w-6 text-orange-600 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t("accessibility.screenReaderSupport")}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                    <li>{t("accessibility.screenReaderList1")}</li>
                    <li>{t("accessibility.screenReaderList2")}</li>
                    <li>{t("accessibility.screenReaderList3")}</li>
                    <li>{t("accessibility.screenReaderList4")}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.browserSupport")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("accessibility.browserDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("accessibility.browserList1")}</li>
                <li>{t("accessibility.browserList2")}</li>
                <li>{t("accessibility.browserList3")}</li>
                <li>{t("accessibility.browserList4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.knownLimitations")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("accessibility.limitationsDesc1")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("accessibility.limitationsList1")}</li>
                <li>{t("accessibility.limitationsList2")}</li>
                <li>{t("accessibility.limitationsList3")}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                {t("accessibility.limitationsDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.accessibilityAdjustments")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("accessibility.adjustmentsDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("accessibility.adjustmentsList1")}</li>
                <li>{t("accessibility.adjustmentsList2")}</li>
                <li>{t("accessibility.adjustmentsList3")}</li>
                <li>{t("accessibility.adjustmentsList4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.feedbackAndReporting")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("accessibility.feedbackDesc")}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700 mb-2">
                  <strong>{t("accessibility.email")}:</strong> akshadvengurlekar35@gmail.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>{t("accessibility.phone")}:</strong> {t("accessibility.phoneValue")}
                </p>
                <p className="text-gray-700">
                  <strong>{t("accessibility.address")}:</strong> {t("accessibility.addressValue")}
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("accessibility.contactInclude")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>{t("accessibility.contactList1")}</li>
                <li>{t("accessibility.contactList2")}</li>
                <li>{t("accessibility.contactList3")}</li>
                <li>{t("accessibility.contactList4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.thirdPartyContent")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("accessibility.thirdPartyDesc1")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("accessibility.thirdPartyList1")}</li>
                <li>{t("accessibility.thirdPartyList2")}</li>
                <li>{t("accessibility.thirdPartyList3")}</li>
                <li>{t("accessibility.thirdPartyList4")}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                {t("accessibility.thirdPartyDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.compliance")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("accessibility.complianceDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("accessibility.complianceList1")}</li>
                <li>{t("accessibility.complianceList2")}</li>
                <li>{t("accessibility.complianceList3")}</li>
                <li>{t("accessibility.complianceList4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.updatesToStatement")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("accessibility.updatesDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("accessibility.alternativeAccess")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("accessibility.alternativeDesc1")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>{t("accessibility.alternativeList1")}</li>
                <li>{t("accessibility.alternativeList2")}</li>
                <li>{t("accessibility.alternativeList3")}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t("accessibility.alternativeDesc2")}
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Accessibility;

