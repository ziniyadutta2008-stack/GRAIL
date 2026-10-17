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
