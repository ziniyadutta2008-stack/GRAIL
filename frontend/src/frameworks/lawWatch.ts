/**
 * Country and regional instruments, plus research notes prepared from cited official texts.
 * A note is not a legal opinion. Nothing here is posted until a person accepts it.
 */

import { DATA_AS_OF } from '../demo/demoData'

export interface LawSource {
  title: string
  publisher: string
  url: string
  documentDate: string
}

export interface LawInstrument {
  id: string
  jurisdiction: string
  name: string
  kind: string
  source: LawSource
  /** Short readings of the cited source. Not a legal opinion and not a copy of the text. */
  points: string[]
  note: string
}

export interface ResearchNote {
  id: string
  instrumentId: string
  title: string
  researchedOn: string
  preparedBy: string
  summary: string[]
  sources: LawSource[]
}

export const LAW_INSTRUMENTS: LawInstrument[] = [
  {
    id: 'eu-ai-act',
    jurisdiction: 'European Union',
    name: 'EU AI Act, Regulation (EU) 2024/1689',
    kind: 'Law',
    source: {
      title: 'Regulation (EU) 2024/1689',
      publisher: 'Official Journal of the European Union',
      url: 'http://data.europa.eu/eli/reg/2024/1689/oj',
      documentDate: '12 July 2024',
    },
    points: [
      'Risk-based regulation: prohibited practices, duties for high-risk systems, transparency duties, and duties for general-purpose AI models.',
      'Article 49 requires the provider of an Annex III high-risk system to register in the EU database before placing it on the market or putting it into service. Critical-infrastructure systems are registered nationally.',
      'Regulation (EU) 2026/1744 amends the high-risk application dates. That note stays a draft until the AI Governance Lead posts it.',
    ],
    note: 'Adopted 13 June 2024. A sourced amendment note is in the research list.',
  },
  {
    id: 'eu-gdpr',
    jurisdiction: 'European Union',
    name: 'GDPR, Regulation (EU) 2016/679',
    kind: 'Law',
    source: {
      title: 'Regulation (EU) 2016/679',
      publisher: 'Official Journal of the European Union',
      url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
      documentDate: '27 April 2016',
    },
    points: [
      'General data-protection rules for personal data in the European Economic Area, including lawfulness, fairness, transparency and accountability.',
      'Articles 13–15 and 22 address information rights and decisions based solely on automated processing that produce legal or similarly significant effects.',
      'This catalogue entry is not a legal opinion and does not decide whether a processing activity is in scope.',
    ],
    note: 'Listed separately from the UK GDPR. No amendment note is posted on this site.',
  },
  {
    id: 'uk-pra',
    jurisdiction: 'United Kingdom',
    name: 'PRA SS1/23 model risk management',
    kind: 'Supervisory expectation',
    source: {
      title: 'SS1/23 Model risk management principles for banks',
      publisher: 'Bank of England, Prudential Regulation Authority',
      url: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2023/may/model-risk-management-principles-for-banks',
      documentDate: '17 May 2023',
    },
    points: [
      'Supervisory expectations, not a statute. Policy Statement PS6/23 of 17 May 2023 contains SS1/23.',
      'As published, the expectations apply to firms with internal-model approval for regulatory capital, with effect from 17 May 2024. This screen does not decide whether a firm is in that scope.',
      'Five principles cover model identification and classification, governance, development and use, independent validation, and model-risk mitigants. AI and machine-learning models are covered to the extent they are models.',
    ],
    note: 'No later amendment is posted on this site.',
  },
  {
    id: 'uk-gdpr',
    jurisdiction: 'United Kingdom',
    name: 'UK GDPR and Data Protection Act 2018',
    kind: 'Law',
    source: {
      title: 'Data Protection Act 2018',
      publisher: 'legislation.gov.uk',
      url: 'https://www.legislation.gov.uk/ukpga/2018/12/contents',
      documentDate: '2018',
    },
    points: [
      'Principles for processing personal data: lawfulness, fairness and transparency, purpose limitation, data minimisation, accuracy, storage limitation, integrity and confidentiality, and accountability.',
      'The Data Protection Act 2018 sits with the UK GDPR and provides for the Information Commissioner’s powers.',
      'A decision based solely on automated processing that produces a legal or similarly significant effect has extra conditions. A missing record is not a finding of breach.',
    ],
    note: 'No AI-specific amendment is posted on this site.',
  },
  {
    id: 'uk-principles',
    jurisdiction: 'United Kingdom',
    name: 'UK pro-innovation AI principles',
    kind: 'Framework',
    source: {
      title: 'A pro-innovation approach to AI regulation',
      publisher: 'UK Government',
      url: 'https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach',
      documentDate: 'March 2023 white paper and subsequent updates',
    },
    points: [
      'Policy framework rather than a single United Kingdom AI statute. Regulators apply existing powers with cross-cutting principles.',
      'Principles commonly referenced on this site include safety, transparency, fairness, accountability and contestability.',
      'This entry is not a legal opinion and does not replace sector rules such as PRA SS1/23 or the UK GDPR.',
    ],
    note: 'No single UK horizontal AI Act is posted on this site.',
  },
  {
    id: 'uk-fca',
    jurisdiction: 'United Kingdom',
    name: 'FCA conduct expectations for AI',
    kind: 'Supervisory expectation',
    source: {
      title: 'Artificial intelligence in financial services and related materials',
      publisher: 'Financial Conduct Authority',
      url: 'https://www.fca.org.uk/',
      documentDate: 'Ongoing supervisory materials',
    },
    points: [
      'Conduct and consumer-protection expectations for firms that use AI in financial services in the United Kingdom.',
      'Screened alongside PRA model-risk expectations for a financial use. This is not an FCA determination.',
      'No separate FCA AI statute is identified on this site.',
    ],
    note: 'Supervisory materials evolve. No amendment note is posted on this site.',
  },
  {
    id: 'france',
    jurisdiction: 'France',
    name: 'EU AI Act as it applies in France, and CNIL',
    kind: 'Law',
    source: {
      title: 'Regulation (EU) 2024/1689',
      publisher: 'Official Journal of the European Union',
      url: 'http://data.europa.eu/eli/reg/2024/1689/oj',
      documentDate: '12 July 2024',
    },
    points: [
      'The EU AI Act applies directly in France. This catalogue does not add a separate French horizontal AI statute.',
      'CNIL is the authority for the GDPR and the Loi Informatique et Libertés.',
      'The EU amendment note, once posted, is the update recorded for France.',
    ],
    note: 'No separate French horizontal AI statute is posted on this site. The EU amendment note applies in France.',
  },
  {
    id: 'eu-ecb',
    jurisdiction: 'European Union',
    name: 'ECB supervisory expectations for models',
    kind: 'Supervisory expectation',
    source: {
      title: 'Guide to internal models and related supervisory communications',
      publisher: 'European Central Bank',
      url: 'https://www.bankingsupervision.europa.eu/',
      documentDate: 'Ongoing supervisory materials',
    },
    points: [
      'Supervisory expectations for model risk in significant euro-area institutions. Not a horizontal AI statute.',
      'Screened when a euro-area or global financial use is recorded. This screen does not decide significant-institution status.',
      'This entry is not an ECB determination or an audit opinion.',
    ],
    note: 'No amendment note is posted on this site.',
  },
  {
    id: 'us-sr117',
    jurisdiction: 'United States',
    name: 'SR 11-7 supervisory guidance on model risk',
    kind: 'Supervisory expectation',
    source: {
      title: 'SR 11-7 Guidance on Model Risk Management',
      publisher: 'Board of Governors of the Federal Reserve System',
      url: 'https://www.federalreserve.gov/boarddocs/srletters/2011/sr1107.htm',
      documentDate: '4 April 2011',
    },
    points: [
      'Federal Reserve and OCC supervisory guidance of 4 April 2011. It is not a statute. No comprehensive US federal AI statute is identified on this site.',
      'The letter describes model development, implementation and use; independent validation; and governance, policies and controls.',
      'SR 26-2 of 17 April 2026 states that it supersedes SR 11-7. That later letter is not posted as an update on this site.',
    ],
    note: 'No comprehensive US federal AI statute is identified. Assess sectoral laws, state AI laws and agency requirements separately.',
  },
  {
    id: 'us-nyc-ll144',
    jurisdiction: 'United States — New York City',
    name: 'NYC Local Law 144 (AEDT)',
    kind: 'Law',
    source: {
      title: 'Automated Employment Decision Tools',
      publisher: 'New York City Department of Consumer and Worker Protection',
      url: 'https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page',
      documentDate: 'Local Law 144 of 2021',
    },
    points: [
      'Applies to automated employment decision tools that score, rank, filter or recommend candidates for hiring or promotion in New York City.',
      'Safeguards addressed on this site include tool classification, human review, evidence recording, monitoring controls and regular audits.',
      'This catalogue entry is a short reading for governance screening. It is not a legal opinion and does not decide whether a system is in scope.',
    ],
    note: 'State and local US instruments stay separate from the federal screening note. No amendment is posted on this site.',
  },
  {
    id: 'us-illinois-video',
    jurisdiction: 'United States — Illinois',
    name: 'Illinois Artificial Intelligence Video Interview Act',
    kind: 'Law',
    source: {
      title: 'Artificial Intelligence Video Interview Act, 820 ILCS 42/',
      publisher: 'Illinois General Assembly',
      url: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=4015&ChapterID=68',
      documentDate: 'Public Act 101-0260',
    },
    points: [
      'Focuses on transparency, understandable explanations and sensitive-data handling when AI is used to analyse video interviews.',
      'The governance reading emphasises reducing privacy and fairness risk without treating the Act as a general hiring statute.',
      'This catalogue entry is not a legal opinion. Confirm Illinois geography and video-interview use before treating the Act as in scope.',
    ],
    note: 'No amendment is posted on this site.',
  },
  {
    id: 'us-colorado-ai',
    jurisdiction: 'United States — Colorado',
    name: 'Colorado Artificial Intelligence Act',
    kind: 'Law',
    source: {
      title: 'Senate Bill 24-205, Consumer Protections for Artificial Intelligence',
      publisher: 'Colorado General Assembly',
      url: 'https://leg.colorado.gov/bills/sb24-205',
      documentDate: 'Signed 15 May 2024',
    },
    points: [
      'Consumer-protection approach for high-risk AI systems and prevention of algorithmic discrimination affecting Colorado consumers.',
      'Governance themes on this site include inventory, testing, monitoring, incident response, vendor accountability for third-party tools and documentation.',
      'Safety and fairness remain ongoing obligations when AI is scaled. This entry is not a legal opinion and does not classify a system as high-risk.',
    ],
    note: 'No amendment is posted on this site.',
  },
  {
    id: 'singapore-mas',
    jurisdiction: 'Singapore',
    name: 'MAS Guidelines on AI Risk Management',
    kind: 'Supervisory expectation',
    source: {
      title: 'Guidelines on Artificial Intelligence Risk Management',
      publisher: 'Monetary Authority of Singapore',
      url: 'https://www.mas.gov.sg/-/media/mas-media-library/regulation/guidelines/bd/guidelines-on-artificial-intelligence-risk-management-for-financial-institutions/guidelines-on-artificial-intelligence-risk-management.pdf',
      documentDate: 'MAS publication',
    },
    points: [
      'Supervisory expectations for financial institutions that use AI. Not a horizontal AI statute.',
      'Separate from the IMDA Model AI Governance Framework, which remains voluntary.',
      'The guideline text is not copied here, and no amendment note is posted on this site.',
    ],
    note: 'No amendment note is posted on this site. The IMDA Model AI Governance Framework remains a voluntary framework.',
  },
  {
    id: 'korea-ai',
    jurisdiction: 'South Korea',
    name: 'Framework Act on AI Development and Trust',
    kind: 'Law',
    source: {
      title: 'Framework Act on the Development of Artificial Intelligence and the Creation of a Foundation for Trust',
      publisher: 'Korea Legislation Research Institute, law.go.kr English text',
      url: 'https://www.law.go.kr/LSW/lsInfoP.do?chrClsCd=010203&lsiSeq=268543&urlMode=engLsInfoR&viewCls=engLsInfoR',
      documentDate: 'In force 22 January 2026',
    },
    points: [
      'The Framework Act has applied since 22 January 2026, as recorded from the cited English text.',
      'High-impact AI duties and a notice for generative AI may apply. This screen does not classify a system.',
      'No later amendment is posted on this site.',
    ],
    note: 'No later amendment is posted on this site.',
  },
  {
    id: 'korea-pipa',
    jurisdiction: 'South Korea',
    name: 'Korea Personal Information Protection Act',
    kind: 'Law',
    source: {
      title: 'Personal Information Protection Act',
      publisher: 'Korea Legislation Research Institute, law.go.kr English text',
      url: 'https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=213857&urlMode=engLsInfoR&viewCls=engLsInfoR',
      documentDate: 'As amended',
    },
    points: [
      'Personal-information rules for processing in South Korea, including automated decision contexts where they apply.',
      'Screened with the AI Framework Act when personal data and Korean deployment are recorded.',
      'This catalogue entry is not a legal opinion and does not decide whether a processing activity is in scope.',
    ],
    note: 'No amendment note is posted on this site.',
  },
  {
    id: 'singapore-imda',
    jurisdiction: 'Singapore',
    name: 'IMDA Model AI Governance Framework',
    kind: 'Framework',
    source: {
      title: 'Model Artificial Intelligence Governance Framework',
      publisher: 'Infocomm Media Development Authority',
      url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/press-releases/2020/singapore-launches-updated-model-ai-governance-framework',
      documentDate: 'Second edition, January 2020, and later guidance',
    },
    points: [
      'Voluntary governance framework for organizations that deploy AI in Singapore. Not a horizontal AI statute.',
      'Themes include internal governance, human-in-the-loop decisions, operations management and stakeholder communication.',
      'Listed separately from MAS supervisory guidelines for financial institutions.',
    ],
    note: 'Voluntary. No amendment note is posted on this site.',
  },
  {
    id: 'singapore-pdpa',
    jurisdiction: 'Singapore',
    name: 'Singapore Personal Data Protection Act',
    kind: 'Law',
    source: {
      title: 'Personal Data Protection Act 2012',
      publisher: 'Personal Data Protection Commission Singapore',
      url: 'https://www.pdpc.gov.sg/Overview-of-PDPA/The-Legislation/Personal-Data-Protection-Act',
      documentDate: '2012, as amended',
    },
    points: [
      'Rules for collecting, using and disclosing personal data in Singapore.',
      'Screened when personal or customer data and Singapore deployment are recorded. A missing record is not a finding of breach.',
      'This catalogue entry is not a legal opinion.',
    ],
    note: 'No amendment note is posted on this site.',
  },
  {
    id: 'china-ai',
    jurisdiction: 'China',
    name: 'China generative AI, deep-synthesis and algorithm rules',
    kind: 'Law',
    source: {
      title: 'Interim Measures for the Management of Generative Artificial Intelligence Services',
      publisher: 'Cyberspace Administration of China',
      url: 'https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm',
      documentDate: 'Effective 15 August 2023',
    },
    points: [
      'China regulates AI through targeted measures rather than one horizontal AI Act: generative-AI services, deep-synthesis content and algorithm recommendation.',
      'Governance themes include security assessment, labelling of synthetic content, algorithm filing for services with public-opinion attributes, and personal-information duties under PIPL where they apply.',
      'Related CAC instruments include the Deep Synthesis Provisions and the Algorithm Recommendation Provisions. This entry is not a legal opinion and does not decide China market access.',
    ],
    note: 'Targeted measures layered over Cybersecurity Law, Data Security Law and PIPL. No amendment note is posted on this site.',
  },
  {
    id: 'japan-ai',
    jurisdiction: 'Japan',
    name: 'Japan AI Promotion Act (Act No. 53 of 2025)',
    kind: 'Law',
    source: {
      title: 'Outline of the Act on Promotion of Research and Development, and Utilization of AI-related Technology',
      publisher: 'Cabinet Office, Government of Japan',
      url: 'https://www8.cao.go.jp/cstp/ai/ai_hou_gaiyou_en.pdf',
      documentDate: 'Established 28 May 2025; full enforcement 1 September 2025',
    },
    points: [
      'Japan’s first AI-specific statute. It promotes R&D and utilization, creates an AI Strategy Headquarters and provides for an AI Basic Plan.',
      'Businesses are asked to cooperate with government measures. The Act is not framed as an EU-style fine-and-prohibition regime in the cited outline.',
      'This catalogue entry is not a legal opinion and does not classify a system under Japanese guidelines.',
    ],
    note: 'Promotion statute with soft cooperation duties. No amendment note is posted on this site.',
  },
  {
    id: 'canada-federal',
    jurisdiction: 'Canada',
    name: 'Canada federal AI statute screening note',
    kind: 'Screening note',
    source: {
      title: 'Artificial Intelligence and Data Act (Bill C-27) status',
      publisher: 'Parliament of Canada',
      url: 'https://www.parl.ca/legisinfo/en/bill/44-1/c-27',
      documentDate: 'Bill C-27 did not become law',
    },
    points: [
      'No comprehensive federal Canadian AI statute is identified on this site after Bill C-27 (including AIDA) died on the Order Paper.',
      'Assess the Directive on Automated Decision-Making for federal institutions, Quebec Law 25 and sectoral privacy rules separately.',
      'This screening note is not a legal opinion.',
    ],
    note: 'Federal AIDA is not posted as enacted law on this site.',
  },
  {
    id: 'canada-adm',
    jurisdiction: 'Canada',
    name: 'Canada Directive on Automated Decision-Making',
    kind: 'Framework',
    source: {
      title: 'Directive on Automated Decision-Making',
      publisher: 'Treasury Board of Canada Secretariat',
      url: 'https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=32592',
      documentDate: 'In force for federal institutions',
    },
    points: [
      'Federal administrative directive for automated decision systems used by Government of Canada institutions.',
      'Requires impact assessment, transparency and human involvement scaled to impact level. It is not a private-sector statute.',
      'Confirm whether the deployer is a federal institution before treating the Directive as in scope.',
    ],
    note: 'Applies to federal institutions. No amendment note is posted on this site.',
  },
  {
    id: 'quebec-law25',
    jurisdiction: 'Canada — Quebec',
    name: 'Quebec Law 25 (automated decision transparency)',
    kind: 'Law',
    source: {
      title: 'Act to modernize legislative provisions as regards the protection of personal information',
      publisher: 'Assemblée nationale du Québec / Commission d’accès à l’information',
      url: 'https://www.cai.gouv.qc.ca/',
      documentDate: 'Law 25 modernization, phased application',
    },
    points: [
      'Quebec privacy modernization with transparency and governance duties for personal information, including automated decision contexts.',
      'Screened when Quebec or Canadian personal-data uses are recorded. Confirm Quebec geography before treating it as in scope.',
      'This catalogue entry is not a legal opinion.',
    ],
    note: 'No amendment note is posted on this site.',
  },
  {
    id: 'brazil-lgpd',
    jurisdiction: 'Brazil',
    name: 'Brazil LGPD automated-decision rights',
    kind: 'Law',
    source: {
      title: 'Lei Geral de Proteção de Dados Pessoais (LGPD), Lei nº 13.709/2018',
      publisher: 'Presidência da República',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
      documentDate: '2018, as amended',
    },
    points: [
      'Article 20 and related provisions address review of decisions based solely on automated processing of personal data.',
      'Brazil’s broader AI bill remains pending on this site; LGPD duties already apply to personal data.',
      'This catalogue entry is not a legal opinion and does not decide whether a decision is solely automated.',
    ],
    note: 'No horizontal Brazilian AI Act is posted as enacted on this site.',
  },
  {
    id: 'brazil-eca',
    jurisdiction: 'Brazil',
    name: 'Brazil ECA Digital algorithmic duties',
    kind: 'Law',
    source: {
      title: 'ECA Digital / Lei nº 15.211/2025 and related publications',
      publisher: 'Presidência da República / Official Gazette',
      url: 'https://www.planalto.gov.br/',
      documentDate: '2025, as published',
    },
    points: [
      'Algorithmic and transparency duties for digital services used by children and adolescents, including reporting obligations where they apply.',
      'Screened for platforms or services with Brazilian minor users. Confirm product scope before treating duties as in force for a system.',
      'This catalogue entry is not a legal opinion.',
    ],
    note: 'Listed separately from LGPD. No amendment note is posted on this site.',
  },
  {
    id: 'australia-ai',
    jurisdiction: 'Australia',
    name: 'Australia AI Ethics Principles and privacy ADM transparency',
    kind: 'Framework',
    source: {
      title: 'Australia’s Artificial Intelligence Ethics Principles',
      publisher: 'Australian Government, Department of Industry, Science and Resources',
      url: 'https://www.industry.gov.au/publications/australias-artificial-intelligence-ethics-framework/australias-ai-ethics-principles',
      documentDate: 'November 2019 principles; later privacy reforms ongoing',
    },
    points: [
      'Voluntary national AI ethics principles. Australia has no horizontal AI Act posted on this site.',
      'Privacy Act reforms add automated decision-making transparency expectations for personal information where they apply.',
      'This entry is not a legal opinion and does not claim mandatory guardrails are fully enacted.',
    ],
    note: 'Voluntary ethics plus privacy ADM transparency. No horizontal AI Act is posted on this site.',
  },
  {
    id: 'india-ai',
    jurisdiction: 'India',
    name: 'India MeitY AI advisories and draft rules',
    kind: 'Framework',
    source: {
      title: 'MeitY advisories and IndiaAI / Digital India programme materials',
      publisher: 'Ministry of Electronics and Information Technology',
      url: 'https://www.meity.gov.in/',
      documentDate: 'Advisories and draft instruments, evolving',
    },
    points: [
      'India has issued MeitY advisories and programme materials for AI platforms. A comprehensive AI statute is not posted as enacted on this site.',
      'Governance themes include due diligence for intermediaries or platforms, labelling of AI-generated content where advised, and alignment with the Digital Personal Data Protection Act for personal data.',
      'Treat draft rules as draft until an official commencement is recorded. This entry is not a legal opinion.',
    ],
    note: 'Draft and advisory materials. No comprehensive Indian AI Act is posted as enacted on this site.',
  },
  {
    id: 'uae-ai',
    jurisdiction: 'United Arab Emirates',
    name: 'UAE National Strategy for Artificial Intelligence 2031',
    kind: 'Framework',
    source: {
      title: 'UAE National Strategy for Artificial Intelligence 2031',
      publisher: 'UAE Government / AI Office',
      url: 'https://ai.gov.ae/',
      documentDate: 'National strategy materials',
    },
    points: [
      'National strategy to position the UAE as a global AI hub, covering government adoption, skills, data and sector programmes.',
      'Strategy and office guidance rather than a single horizontal AI statute comparable to the EU AI Act.',
      'This catalogue entry is not a legal opinion and does not replace sector licences or free-zone rules.',
    ],
    note: 'Strategy and programme materials. No single UAE horizontal AI Act is posted on this site.',
  },
  {
    id: 'iso-42001',
    jurisdiction: 'International',
    name: 'ISO/IEC 42001',
    kind: 'Framework',
    source: {
      title: 'ISO/IEC 42001',
      publisher: 'ISO',
      url: 'https://www.iso.org/standard/81230.html',
      documentDate: 'Published standard',
    },
    points: [
      'International standard for an AI management system. The standard text is not reproduced.',
      'GRAIL maps organization-authored control summaries. A mapping is not certification.',
      'Implemented still requires current evidence, an owner, and a completed validation.',
    ],
    note: 'The standard text is not reproduced. No amendment is posted on this site.',
  },
  {
    id: 'iso-23894',
    jurisdiction: 'International',
    name: 'ISO/IEC 23894',
    kind: 'Framework',
    source: {
      title: 'ISO/IEC 23894 Artificial intelligence — Guidance on risk management',
      publisher: 'ISO',
      url: 'https://www.iso.org/standard/77304.html',
      documentDate: 'Published standard',
    },
    points: [
      'International guidance on AI risk management. The standard text is not reproduced.',
      'Screened alongside ISO/IEC 42001. Guidance is not certification.',
      'Organization-authored risk records remain the evidence for GRAIL assessments.',
    ],
    note: 'The standard text is not reproduced. No amendment is posted on this site.',
  },
  {
    id: 'nist',
    jurisdiction: 'International',
    name: 'NIST AI Risk Management Framework 1.0',
    kind: 'Framework',
    source: {
      title: 'AI Risk Management Framework',
      publisher: 'National Institute of Standards and Technology',
      url: 'https://www.nist.gov/itl/ai-risk-management-framework',
      documentDate: '26 January 2023',
    },
    points: [
      'Voluntary framework, released on 26 January 2023, for managing AI risk to people, organizations, and society.',
      'The functions used by this screen are Govern, Map, Measure, and Manage. Alignment is not claimed.',
      'NIST published a generative-AI profile, AI 600-1, on 26 July 2024, and states that AI RMF 1.0 is being revised. No successor is posted on this site.',
    ],
    note: 'No successor version is posted on this site.',
  },
  {
    id: 'oecd',
    jurisdiction: 'International',
    name: 'OECD AI Principles',
    kind: 'Framework',
    source: {
      title: 'OECD AI Principles',
      publisher: 'OECD',
      url: 'https://oecd.ai/en/ai-principles',
      documentDate: 'Adopted May 2019, updated May 2024',
    },
    points: [
      'Intergovernmental recommendation, adopted in May 2019 and updated in May 2024.',
      'The values used by this screen are inclusive growth, human-centred values, transparency, robustness, and accountability. They are principles, not a statute.',
      'The recommendation includes a definition of an AI system. Adherence is not a finding that a system meets the principles.',
    ],
    note: 'No amendment is posted on this site.',
  },
  {
    id: 'unesco',
    jurisdiction: 'International',
    name: 'UNESCO Recommendation on the Ethics of Artificial Intelligence',
    kind: 'Framework',
    source: {
      title: 'Recommendation on the Ethics of Artificial Intelligence',
      publisher: 'UNESCO',
      url: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics',
      documentDate: 'Adopted November 2021',
    },
    points: [
      'Global soft-law recommendation on values and principles for ethical AI, including human rights, fairness, transparency and accountability.',
      'Addressed to Member States. It is not a statute and does not by itself create private-party duties.',
      'This catalogue entry is not a legal opinion.',
    ],
    note: 'Soft law. No amendment is posted on this site.',
  },
  {
    id: 'coe-ai',
    jurisdiction: 'International',
    name: 'Council of Europe Framework Convention on AI',
    kind: 'Law',
    source: {
      title: 'Framework Convention on Artificial Intelligence and Human Rights, Democracy and the Rule of Law',
      publisher: 'Council of Europe',
      url: 'https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence',
      documentDate: 'Opened for signature 2024; ratification ongoing',
    },
    points: [
      'First binding international treaty focused on AI, human rights, democracy and the rule of law.',
      'Entry into force depends on ratifications. The European Union’s ratification is recorded in public sources; confirm current parties before treating duties as in force for a jurisdiction.',
      'This catalogue entry is not a legal opinion and does not map every Party’s domestic implementing measure.',
    ],
    note: 'Treaty status changes with ratifications. No domestic implementing package is posted on this site.',
  },
  {
    id: 'g7-hiroshima',
    jurisdiction: 'International',
    name: 'G7 Hiroshima AI Process',
    kind: 'Framework',
    source: {
      title: 'Hiroshima Process International Code of Conduct for Organizations Developing Advanced AI Systems',
      publisher: 'G7 / OECD Hiroshima AI Process materials',
      url: 'https://www.mofa.go.jp/files/100573473.pdf',
      documentDate: 'October 2023 Code of Conduct and subsequent process updates',
    },
    points: [
      'Voluntary international code for organizations developing advanced AI systems, covering risk management, transparency and misuse mitigation.',
      'Political commitment among G7 partners rather than a statute. Alignment is not claimed.',
      'This catalogue entry is not a legal opinion.',
    ],
    note: 'Voluntary code. No amendment note is posted on this site.',
  },
  {
    id: 'ieee-ethics',
    jurisdiction: 'International',
    name: 'IEEE ethically aligned design and AI standards',
    kind: 'Framework',
    source: {
      title: 'Ethically Aligned Design and IEEE 7000-series standards',
      publisher: 'IEEE',
      url: 'https://standards.ieee.org/industry-connections/ec/autonomous-systems/',
      documentDate: 'Ethically Aligned Design and published 7000-series standards',
    },
    points: [
      'Industry and professional standards for ethical considerations in autonomous and intelligent systems.',
      'IEEE 7000 addresses ethical concerns during system design. Standards are voluntary unless adopted by contract or regulation.',
      'This catalogue entry is not a certification and not a legal opinion.',
    ],
    note: 'Voluntary standards. No amendment note is posted on this site.',
  },
  {
    id: 'ms-rai',
    jurisdiction: 'Organization reference',
    name: 'Microsoft Responsible AI Standard v2',
    kind: 'Framework',
    source: {
      title: 'Microsoft Responsible AI Standard',
      publisher: 'Microsoft',
      url: 'https://www.microsoft.com/en-us/ai/responsible-ai',
      documentDate: 'Version 2 organization reference',
    },
    points: [
      'Organization-authored responsible-AI goals used by GRAIL assessments. Official standard text is not reproduced.',
      'Goal identifiers in seed data are organization interpretations. Meeting a goal in GRAIL is not Microsoft certification.',
      'This catalogue entry supports framework mapping. It is not a legal instrument.',
    ],
    note: 'Organization reference only. No amendment is posted on this site.',
  },
  {
    id: 'owasp',
    jurisdiction: 'International',
    name: 'OWASP Top 10 for LLM Applications 2025',
    kind: 'Framework',
    source: {
      title: 'OWASP Top 10 for Large Language Model Applications',
      publisher: 'OWASP',
      url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
      documentDate: '2025 edition',
    },
    points: [
      'A public 2025 risk list for applications that use large language models. The list is not reproduced.',
      'The screen looks for whether prompt injection, sensitive-information disclosure, and improper output handling are described.',
      'A Gap means those risks are not described on the system record. It is not evidence that an attack has occurred.',
    ],
    note: 'The list is not reproduced. No later edition is posted on this site.',
  },
]

/** Prepared from the cited Official Journal text. The preview does not search the web at runtime. */
export const RESEARCH_NOTES: ResearchNote[] = [
  {
    id: 'note-eu-2026-1744',
    instrumentId: 'eu-ai-act',
    title: 'EU AI Act high-risk dates changed by Regulation (EU) 2026/1744',
    researchedOn: DATA_AS_OF,
    preparedBy: 'Regulatory Watch',
    summary: [
      'Regulation (EU) 2026/1744 of 8 July 2026 amends the EU AI Act. It was published in the Official Journal on 24 July 2026.',
      'Article 4 of the amending regulation says it enters into force on the third day after that publication.',
      'Article 113 of the AI Act, as amended, says Chapter III, Sections 1, 2 and 3, except Article 6(5), apply from 2 December 2027 for high-risk systems under Article 6(2) and Annex III, and from 2 August 2028 for high-risk systems under Article 6(1) and Annex I.',
      'The same article says Article 5(1), first subparagraph, points (ba) and (bb), and Article 5(1a) and (1b), apply from 2 December 2026.',
      'Article 111(4), as amended, says providers of systems that generate synthetic audio, image, video or text and were placed on the market before 2 August 2026 must comply with Article 50(2) by 2 December 2026.',
      'This note does not classify any system in GRAIL and is not a legal opinion.',
    ],
    sources: [
      {
        title: 'Regulation (EU) 2026/1744, Articles 1(39), 1(40) and 4',
        publisher: 'Official Journal of the European Union, L series, 24 July 2026',
        url: 'http://data.europa.eu/eli/reg/2026/1744/oj',
        documentDate: '8 July 2026',
      },
      {
        title: 'Regulation (EU) 2024/1689, the AI Act being amended',
        publisher: 'Official Journal of the European Union',
        url: 'http://data.europa.eu/eli/reg/2024/1689/oj',
        documentDate: '12 July 2024',
      },
    ],
  },
]

export interface PostedNote {
  id: string
  status: 'Draft' | 'Posted' | 'Rejected'
  postedOn?: string
}
