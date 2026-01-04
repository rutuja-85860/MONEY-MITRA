import SafeToSpendEngine from "./SafeToSpendEngine.js";

class VoiceAdvisoryService {
  /**
   * ========================================
   * SUPPORTED LANGUAGES
   * ========================================
   */
  static SUPPORTED_LANGUAGES = {
    en: "English",
    hi: "Hindi",
    mr: "Marathi",
  };

  /**
   * ========================================
   * TRANSLATIONS (Deterministic Text Only)
   * ========================================
   */
  static TRANSLATIONS = {
    // Safe-to-Spend Status
    safe_to_spend_daily: {
      en: "You can safely spend rupees {amount} per day for the next {days} days.",
      hi: "आप अगले {days} दिनों के लिए प्रतिदिन {amount} रुपये सुरक्षित रूप से खर्च कर सकते हैं।",
      mr: "तुम्ही पुढील {days} दिवसांसाठी दररोज {amount} रुपये सुरक्षितपणे खर्च करू शकता.",
    },
    safe_to_spend_monthly: {
      en: "Your total remaining Safe-to-Spend amount is rupees {amount}.",
      hi: "आपकी कुल शेष सुरक्षित खर्च राशि {amount} रुपये है।",
      mr: "तुमची एकूण उर्वरित सुरक्षित खर्च रक्कम {amount} रुपये आहे.",
    },

    // Exhaustion Forecast
    exhaustion_safe: {
      en: "Your balance is stable. At current pace, funds will last beyond 30 days.",
      hi: "आपका बैलेंस स्थिर है। वर्तमान गति से, धन 30 दिनों से अधिक चलेगा।",
      mr: "तुमचा शिल्लक स्थिर आहे. सध्याच्या गतीने, निधी 30 दिवसांपेक्षा जास्त काळ टिकेल.",
    },
    exhaustion_warning: {
      en: "Warning. At current spending pace, your balance will be exhausted in {days} days on {date}.",
      hi: "चेतावनी। वर्तमान खर्च की गति से, आपका बैलेंस {days} दिनों में {date} को समाप्त हो जाएगा।",
      mr: "चेतावणी. सध्याच्या खर्चाच्या गतीने, तुमचा शिल्लक {days} दिवसांत {date} रोजी संपेल.",
    },
    exhaustion_critical: {
      en: "Critical alert. Your balance will run out in {days} days. Daily spending must reduce to rupees {required} immediately.",
      hi: "गंभीर चेतावनी। आपका बैलेंस {days} दिनों में समाप्त हो जाएगा। दैनिक खर्च तुरंत {required} रुपये तक कम करना होगा।",
      mr: "गंभीर सूचना. तुमचा शिल्लक {days} दिवसांत संपेल. दैनंदिन खर्च लगेच {required} रुपयांपर्यंत कमी करणे आवश्यक आहे.",
    },

    // Overspending Alerts
    velocity_breach: {
      en: "Alert. Your current daily spending of rupees {current} exceeds safe limit of rupees {limit}.",
      hi: "चेतावनी। आपका वर्तमान दैनिक खर्च {current} रुपये सुरक्षित सीमा {limit} रुपये से अधिक है।",
      mr: "सूचना. तुमचा सध्याचा दैनंदिन खर्च {current} रुपये सुरक्षित मर्यादा {limit} रुपयांपेक्षा जास्त आहे.",
    },
    income_coverage_critical: {
      en: "Critical. Your income does not cover fixed obligations. Shortfall is rupees {shortfall}.",
      hi: "गंभीर। आपकी आय निश्चित दायित्वों को कवर नहीं करती है। कमी {shortfall} रुपये है।",
      mr: "गंभीर. तुमचे उत्पन्न निश्चित दायित्वे भागवत नाही. तूट {shortfall} रुपये आहे.",
    },
    income_coverage_warning: {
      en: "Warning. Income barely covers fixed obligations. Buffer is only rupees {buffer}.",
      hi: "चेतावनी। आय मुश्किल से निश्चित दायित्वों को कवर करती है। बफर केवल {buffer} रुपये है।",
      mr: "चेतावणी. उत्पन्न केवळ निश्चित दायित्वे भागवते. बफर फक्त {buffer} रुपये आहे.",
    },

    // Risk Status
    risk_improving: {
      en: "Your spending patterns are improving. No penalty applied.",
      hi: "आपके खर्च के पैटर्न में सुधार हो रहा है। कोई दंड लागू नहीं।",
      mr: "तुमचे खर्चाचे नमुने सुधारत आहेत. कोणतीही दंड लागू नाही.",
    },
    risk_stable: {
      en: "Spending trends are stable. Safe-to-Spend reduced by 10 percent as precaution.",
      hi: "खर्च के रुझान स्थिर हैं। सावधानी के रूप में सुरक्षित खर्च में 10 प्रतिशत की कमी।",
      mr: "खर्चाचे ट्रेंड स्थिर आहेत. खबरदारी म्हणून सुरक्षित खर्च 10 टक्के कमी केला.",
    },
    risk_deteriorating: {
      en: "Warning. Spending patterns are deteriorating. Safe-to-Spend reduced by 30 percent for protection.",
      hi: "चेतावनी। खर्च के पैटर्न बिगड़ रहे हैं। सुरक्षा के लिए सुरक्षित खर्च में 30 प्रतिशत की कमी।",
      mr: "चेतावणी. खर्चाचे नमुने बिघडत आहेत. संरक्षणासाठी सुरक्षित खर्च 30 टक्के कमी केला.",
    },

    // Breach Flags Explanations
    breach_non_essential: {
      en: "Non-essential spending surged {percent} percent this month.",
      hi: "इस महीने गैर-आवश्यक खर्च {percent} प्रतिशत बढ़ा।",
      mr: "या महिन्यात गैर-आवश्यक खर्च {percent} टक्के वाढला.",
    },
    breach_expense_ratio: {
      en: "You are spending {percent} percent of your income.",
      hi: "आप अपनी आय का {percent} प्रतिशत खर्च कर रहे हैं।",
      mr: "तुम्ही तुमच्या उत्पन्नाचा {percent} टक्के खर्च करत आहात.",
    },
    breach_total_increase: {
      en: "Total spending increased {percent} percent compared to last month.",
      hi: "पिछले महीने की तुलना में कुल खर्च {percent} प्रतिशत बढ़ा।",
      mr: "मागील महिन्याच्या तुलनेत एकूण खर्च {percent} टक्के वाढला.",
    },

    // Category Insights
    category_top: {
      en: "{category} is your highest spending category at {percent} percent of total expenses.",
      hi: "{category} आपकी कुल खर्च का {percent} प्रतिशत के साथ सबसे अधिक खर्च श्रेणी है।",
      mr: "{category} हा तुमचा सर्वाधिक खर्च श्रेणी आहे, एकूण खर्चाच्या {percent} टक्के.",
    },

    // Actionable Advice
    advice_reduce_daily: {
      en: "To extend balance, reduce daily spending by rupees {amount}.",
      hi: "बैलेंस बढ़ाने के लिए, दैनिक खर्च {amount} रुपये कम करें।",
      mr: "शिल्लक वाढविण्यासाठी, दैनंदिन खर्च {amount} रुपयांनी कमी करा.",
    },
    advice_increase_income: {
      en: "Income does not adequately cover expenses. Consider increasing income or reducing obligations.",
      hi: "आय खर्चों को पर्याप्त रूप से कवर नहीं करती है। आय बढ़ाने या दायित्वों को कम करने पर विचार करें।",
      mr: "उत्पन्न खर्च पुरेसे भागवत नाही. उत्पन्न वाढवणे किंवा दायित्वे कमी करणे विचारात घ्या.",
    },
  };

  /**
   * ========================================
   * UTILITY: Replace Placeholders
   * ========================================
   */
  static replacePlaceholders(template, data) {
    let text = template;
    Object.keys(data).forEach((key) => {
      text = text.replace(new RegExp(`{${key}}`, "g"), data[key]);
    });
    return text;
  }

  /**
   * ========================================
   * UTILITY: Format Currency
   * ========================================
   */
  static formatCurrency(amount) {
    return Math.round(amount).toLocaleString("en-IN");
  }

  /**
   * ========================================
   * UTILITY: Format Date
   * ========================================
   */
  static formatDate(date, lang = "en") {
    if (!date) return "unknown date";
    const d = new Date(date);
    if (lang === "hi") {
      return d.toLocaleDateString("hi-IN");
    } else if (lang === "mr") {
      return d.toLocaleDateString("mr-IN");
    }
    return d.toLocaleDateString("en-IN");
  }

  /**
   * ========================================
   * MAIN METHOD: Generate Voice Advisory
   * ========================================
   */
  static async generateAdvisory(userId, lang = "en", query = null) {
    // Validate language
    if (!this.SUPPORTED_LANGUAGES[lang]) {
      throw new Error(`Unsupported language: ${lang}`);
    }

    // Fetch Safe-to-Spend data
    const engineData = await SafeToSpendEngine.calculate(userId);

    const advisory = {
      language: lang,
      timestamp: new Date(),
      sections: [],
    };

    // SECTION 1: Safe-to-Spend Status (Always Include)
    advisory.sections.push({
      type: "safe_to_spend_status",
      severity: "INFO",
      text: this.replacePlaceholders(
        this.TRANSLATIONS.safe_to_spend_daily[lang],
        {
          amount: this.formatCurrency(engineData.dailyAllowance),
          days: engineData.remainingDays,
        }
      ),
    });

    advisory.sections.push({
      type: "safe_to_spend_monthly",
      severity: "INFO",
      text: this.replacePlaceholders(
        this.TRANSLATIONS.safe_to_spend_monthly[lang],
        {
          amount: this.formatCurrency(engineData.remainingSafeToSpend),
        }
      ),
    });

    // SECTION 2: Exhaustion Forecast
    if (engineData.daysUntilExhaustion <= 7) {
      const requiredDaily = Math.round(engineData.currentBalance / 30);
      advisory.sections.push({
        type: "exhaustion_forecast",
        severity: "CRITICAL",
        text: this.replacePlaceholders(
          this.TRANSLATIONS.exhaustion_critical[lang],
          {
            days: engineData.daysUntilExhaustion,
            required: this.formatCurrency(requiredDaily),
          }
        ),
      });
    } else if (engineData.daysUntilExhaustion <= 15) {
      advisory.sections.push({
        type: "exhaustion_forecast",
        severity: "WARNING",
        text: this.replacePlaceholders(
          this.TRANSLATIONS.exhaustion_warning[lang],
          {
            days: engineData.daysUntilExhaustion,
            date: this.formatDate(engineData.exhaustionDate, lang),
          }
        ),
      });
    } else {
      advisory.sections.push({
        type: "exhaustion_forecast",
        severity: "INFO",
        text: this.TRANSLATIONS.exhaustion_safe[lang],
      });
    }

    // SECTION 3: Velocity Breach Alert
    if (engineData.currentDailySpend > engineData.dailyAllowance) {
      advisory.sections.push({
        type: "velocity_breach",
        severity: "WARNING",
        text: this.replacePlaceholders(
          this.TRANSLATIONS.velocity_breach[lang],
          {
            current: this.formatCurrency(engineData.currentDailySpend),
            limit: this.formatCurrency(engineData.dailyAllowance),
          }
        ),
      });
    }

    // SECTION 4: Income Coverage Alerts
    if (engineData.incomeCoverageRatio < 1.0) {
      const shortfall = Math.round(
        engineData.avgMonthlyIncome * (1 - engineData.incomeCoverageRatio)
      );
      advisory.sections.push({
        type: "income_coverage",
        severity: "CRITICAL",
        text: this.replacePlaceholders(
          this.TRANSLATIONS.income_coverage_critical[lang],
          {
            shortfall: this.formatCurrency(shortfall),
          }
        ),
      });
    } else if (engineData.incomeCoverageRatio < 1.2) {
      const buffer = Math.round(
        engineData.avgMonthlyIncome * (engineData.incomeCoverageRatio - 1)
      );
      advisory.sections.push({
        type: "income_coverage",
        severity: "WARNING",
        text: this.replacePlaceholders(
          this.TRANSLATIONS.income_coverage_warning[lang],
          {
            buffer: this.formatCurrency(buffer),
          }
        ),
      });
    }

    // SECTION 5: Risk Status Explanation
    if (engineData.riskStatus === "IMPROVING") {
      advisory.sections.push({
        type: "risk_status",
        severity: "INFO",
        text: this.TRANSLATIONS.risk_improving[lang],
      });
    } else if (engineData.riskStatus === "STABLE") {
      advisory.sections.push({
        type: "risk_status",
        severity: "WARNING",
        text: this.TRANSLATIONS.risk_stable[lang],
      });
    } else if (engineData.riskStatus === "DETERIORATING") {
      advisory.sections.push({
        type: "risk_status",
        severity: "CRITICAL",
        text: this.TRANSLATIONS.risk_deteriorating[lang],
      });
    }

    // SECTION 6: Breach Flags (Explainability)
    engineData.breachFlags.forEach((flag) => {
      let translationKey = null;
      let data = {};

      if (flag.includes("Non-essential spending surged")) {
        const percent = flag.match(/\d+/)?.[0] || "0";
        translationKey = "breach_non_essential";
        data = { percent };
      } else if (flag.includes("Spending")) {
        const percent = flag.match(/\d+/)?.[0] || "0";
        translationKey = "breach_expense_ratio";
        data = { percent };
      } else if (flag.includes("increased")) {
        const percent = flag.match(/\d+/)?.[0] || "0";
        translationKey = "breach_total_increase";
        data = { percent };
      }

      if (translationKey && this.TRANSLATIONS[translationKey]) {
        advisory.sections.push({
          type: "breach_explanation",
          severity: "WARNING",
          text: this.replacePlaceholders(
            this.TRANSLATIONS[translationKey][lang],
            data
          ),
        });
      }
    });

    // SECTION 7: Actionable Advice
    engineData.advice.forEach((item) => {
      let translationKey = null;
      let data = {};

      if (item.includes("Reduce daily spending")) {
        const amount = item.match(/₹([\d,]+)/)?.[1]?.replace(/,/g, "") || "0";
        translationKey = "advice_reduce_daily";
        data = { amount: this.formatCurrency(Number(amount)) };
      } else if (item.includes("income")) {
        translationKey = "advice_increase_income";
      }

      if (translationKey && this.TRANSLATIONS[translationKey]) {
        advisory.sections.push({
          type: "actionable_advice",
          severity: "INFO",
          text: this.replacePlaceholders(
            this.TRANSLATIONS[translationKey][lang],
            data
          ),
        });
      }
    });

    // SECTION 8: Query-Specific Response
    if (query) {
      const queryLower = query.toLowerCase();

      // "How much can I spend today?"
      if (
        queryLower.includes("spend today") ||
        queryLower.includes("आज") ||
        queryLower.includes("आज")
      ) {
        return {
          language: lang,
          response: this.replacePlaceholders(
            this.TRANSLATIONS.safe_to_spend_daily[lang],
            {
              amount: this.formatCurrency(engineData.dailyAllowance),
              days: engineData.remainingDays,
            }
          ),
        };
      }

      // "When will my money run out?"
      if (
        queryLower.includes("run out") ||
        queryLower.includes("खत्म") ||
        queryLower.includes("संपेल")
      ) {
        if (engineData.daysUntilExhaustion <= 15) {
          return {
            language: lang,
            response: this.replacePlaceholders(
              this.TRANSLATIONS.exhaustion_warning[lang],
              {
                days: engineData.daysUntilExhaustion,
                date: this.formatDate(engineData.exhaustionDate, lang),
              }
            ),
          };
        } else {
          return {
            language: lang,
            response: this.TRANSLATIONS.exhaustion_safe[lang],
          };
        }
      }
    }

    return advisory;
  }

  /**
   * ========================================
   * ALERT-SPECIFIC ADVISORY (Push-Based)
   * ========================================
   */
  static async generateAlertAdvisory(userId, alertType, lang = "en") {
    const engineData = await SafeToSpendEngine.calculate(userId);

    switch (alertType) {
      case "velocity_breach":
        return {
          language: lang,
          severity: "WARNING",
          text: this.replacePlaceholders(
            this.TRANSLATIONS.velocity_breach[lang],
            {
              current: this.formatCurrency(engineData.currentDailySpend),
              limit: this.formatCurrency(engineData.dailyAllowance),
            }
          ),
        };

      case "exhaustion_warning":
        return {
          language: lang,
          severity: "CRITICAL",
          text: this.replacePlaceholders(
            this.TRANSLATIONS.exhaustion_warning[lang],
            {
              days: engineData.daysUntilExhaustion,
              date: this.formatDate(engineData.exhaustionDate, lang),
            }
          ),
        };

      default:
        return null;
    }
  }
}

export default VoiceAdvisoryService;
