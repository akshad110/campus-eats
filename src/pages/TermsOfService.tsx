import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Scale, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const TermsOfService = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t("termsOfService.title")}
            </h1>
          </div>
          <p className="text-gray-600">
            {t("termsOfService.lastUpdated")}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5 text-orange-600" />
                {t("termsOfService.agreementToTerms")}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t("termsOfService.agreementDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. {t("termsOfService.useOfService")}</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">1.1 {t("termsOfService.eligibility")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.eligibilityDesc")}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">1.2 {t("termsOfService.accountRegistration")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.registrationDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("termsOfService.registrationList1")}</li>
                <li>{t("termsOfService.registrationList2")}</li>
                <li>{t("termsOfService.registrationList3")}</li>
                <li>{t("termsOfService.registrationList4")}</li>
                <li>{t("termsOfService.registrationList5")}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">1.3 {t("termsOfService.acceptableUse")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.acceptableUseDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>{t("termsOfService.acceptableUseList1")}</li>
                <li>{t("termsOfService.acceptableUseList2")}</li>
                <li>{t("termsOfService.acceptableUseList3")}</li>
                <li>{t("termsOfService.acceptableUseList4")}</li>
                <li>{t("termsOfService.acceptableUseList5")}</li>
                <li>{t("termsOfService.acceptableUseList6")}</li>
                <li>{t("termsOfService.acceptableUseList7")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. {t("termsOfService.ordersAndPayments")}</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 {t("termsOfService.orderPlacement")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.orderPlacementDesc")}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 {t("termsOfService.pricingAndPayment")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <CheckCircle className="h-4 w-4 inline text-green-600 mr-1" />
                {t("termsOfService.pricingDesc1")}
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <CheckCircle className="h-4 w-4 inline text-green-600 mr-1" />
                {t("termsOfService.pricingDesc2")}
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <CheckCircle className="h-4 w-4 inline text-green-600 mr-1" />
                {t("termsOfService.pricingDesc3")}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 {t("termsOfService.cancellationAndRefunds")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <AlertTriangle className="h-4 w-4 inline text-yellow-600 mr-1" />
                {t("termsOfService.cancellationDesc1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("termsOfService.cancellationDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. {t("termsOfService.shopkeeperResponsibilities")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.shopkeeperDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("termsOfService.shopkeeperList1")}</li>
                <li>{t("termsOfService.shopkeeperList2")}</li>
                <li>{t("termsOfService.shopkeeperList3")}</li>
                <li>{t("termsOfService.shopkeeperList4")}</li>
                <li>{t("termsOfService.shopkeeperList5")}</li>
                <li>{t("termsOfService.shopkeeperList6")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. {t("termsOfService.intellectualProperty")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.ipDesc1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("termsOfService.ipDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. {t("termsOfService.disclaimers")}</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.1 {t("termsOfService.serviceAvailability")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.availabilityDesc")}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 {t("termsOfService.foodQuality")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <AlertTriangle className="h-4 w-4 inline text-yellow-600 mr-1" />
                {t("termsOfService.foodQualityDesc")}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.3 {t("termsOfService.limitationOfLiability")}</h3>
              <p className="text-gray-700 leading-relaxed">
                {t("termsOfService.liabilityDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. {t("termsOfService.indemnification")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("termsOfService.indemnificationDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. {t("termsOfService.termination")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.terminationDesc1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("termsOfService.terminationDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. {t("termsOfService.changesToTerms")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("termsOfService.changesDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. {t("termsOfService.governingLaw")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("termsOfService.governingLawDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. {t("termsOfService.contactInformation")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("termsOfService.contactDesc")}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>{t("termsOfService.email")}:</strong> akshadvengurlekar35@gmail.com
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>{t("termsOfService.address")}:</strong> {t("termsOfService.addressValue")}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;

