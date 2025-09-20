/**
 * Rights Management Service
 * Handles copyright registration, rights tracking, contract management,
 * and revenue distribution for authors
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RightsTransactionData {
  publishingProjectId: string;
  rightsType: 'film' | 'tv' | 'translation' | 'audio' | 'foreign' | 'subsidiary' | 'merchandising';
  territory?: string;
  language?: string;
  grantorName: string;
  granteeName: string;
  agentName?: string;
  advance: number;
  royaltyRate: number;
  minimumGuarantee: number;
  startDate: Date;
  endDate?: Date;
  isExclusive: boolean;
}

export interface ContractData {
  publishingProjectId: string;
  contractType: 'book_deal' | 'option' | 'film_rights' | 'translation' | 'audio_rights';
  publisherId?: string;
  agentId?: string;
  advance: number;
  royaltyRate: string;
  territories: string[];
  rightsGranted: string[];
  exclusivityPeriod?: number;
  signedAt?: Date;
  effectiveDate?: Date;
  expirationDate?: Date;
}

export interface CopyrightRegistration {
  publishingProjectId: string;
  title: string;
  authorName: string;
  copyrightYear: number;
  registrationNumber?: string;
  registrationDate?: Date;
  workType: 'text' | 'audiobook' | 'ebook' | 'compilation';
  publicationDate?: Date;
  countryOfOrigin: string;
}

export interface RevenueDistribution {
  sourceType: 'book_sales' | 'rights_sale' | 'advance' | 'royalties' | 'subsidiary';
  grossAmount: number;
  agentCommission?: number;
  publisherShare?: number;
  coAuthorShares?: Array<{ authorId: string; percentage: number }>;
  netAuthorAmount: number;
  currency: string;
  date: Date;
}

export interface RightsPortfolio {
  publishingProject: any;
  copyrightStatus: {
    isRegistered: boolean;
    registrationNumber?: string;
    registrationDate?: Date;
    expirationDate: Date;
  };
  availableRights: Array<{
    rightsType: string;
    territories: string[];
    status: 'available' | 'optioned' | 'sold';
    estimatedValue: number;
  }>;
  activeContracts: Array<{
    contractType: string;
    party: string;
    startDate: Date;
    endDate?: Date;
    value: number;
    status: string;
  }>;
  revenueHistory: Array<{
    date: Date;
    source: string;
    amount: number;
    currency: string;
  }>;
  totalLifetimeValue: number;
}

export class RightsManagementService {

  /**
   * Register copyright for a work
   */
  async registerCopyright(data: CopyrightRegistration) {
    const project = await prisma.publishingProject.findUnique({
      where: { id: data.publishingProjectId }
    });

    if (!project) {
      throw new Error('Publishing project not found');
    }

    // Update project with copyright information
    const updatedProject = await prisma.publishingProject.update({
      where: { id: data.publishingProjectId },
      data: {
        copyrightHolder: data.authorName,
        copyrightYear: data.copyrightYear,
        rightsStatus: 'retained'
      }
    });

    // In a real implementation, this would integrate with copyright office APIs
    // For now, we'll simulate the registration process
    const registrationNumber = this.generateRegistrationNumber(data.countryOfOrigin);
    
    return {
      project: updatedProject,
      registration: {
        ...data,
        registrationNumber,
        registrationDate: new Date(),
        status: 'pending_review',
        estimatedProcessingTime: '6-8 months',
        filingFee: this.calculateCopyrightFee(data.workType, data.countryOfOrigin)
      }
    };
  }

  /**
   * Create a rights transaction
   */
  async createRightsTransaction(data: RightsTransactionData) {
    const transaction = await prisma.rightsTransaction.create({
      data: {
        publishingProjectId: data.publishingProjectId,
        rightsType: data.rightsType,
        territory: data.territory,
        language: data.language,
        grantorName: data.grantorName,
        granteeName: data.granteeName,
        agentName: data.agentName,
        advance: data.advance,
        royaltyRate: data.royaltyRate,
        minimumGuarantee: data.minimumGuarantee,
        startDate: data.startDate,
        endDate: data.endDate,
        isExclusive: data.isExclusive,
        status: 'negotiating'
      },
      include: {
        publishingProject: true
      }
    });

    // Update project rights status
    await this.updateProjectRightsStatus(data.publishingProjectId, data.rightsType, 'optioned');

    return transaction;
  }

  /**
   * Create a publishing contract
   */
  async createContract(data: ContractData) {
    const contract = await prisma.publishingContract.create({
      data: {
        publishingProjectId: data.publishingProjectId,
        contractType: data.contractType,
        publisherId: data.publisherId,
        agentId: data.agentId,
        advance: data.advance,
        royaltyRate: data.royaltyRate,
        territories: JSON.stringify(data.territories),
        rightsGranted: JSON.stringify(data.rightsGranted),
        exclusivityPeriod: data.exclusivityPeriod,
        signedAt: data.signedAt,
        effectiveDate: data.effectiveDate,
        expirationDate: data.expirationDate,
        status: data.signedAt ? 'signed' : 'negotiating'
      },
      include: {
        publishingProject: true,
        publisher: true
      }
    });

    // Update project status if this is a book deal
    if (data.contractType === 'book_deal' && data.signedAt) {
      await prisma.publishingProject.update({
        where: { id: data.publishingProjectId },
        data: {
          status: 'published',
          publishedAt: new Date()
        }
      });
    }

    return contract;
  }

  /**
   * Track revenue and calculate distributions
   */
  async recordRevenue(
    contractId: string,
    revenue: RevenueDistribution
  ) {
    const contract = await prisma.publishingContract.findUnique({
      where: { id: contractId },
      include: {
        publishingProject: {
          include: {
            author: true
          }
        }
      }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Calculate distributions
    const distributions = this.calculateRevenueDistribution(revenue, contract);

    // Record the revenue
    // In a full implementation, this would be stored in a Revenue table
    
    return {
      grossRevenue: revenue.grossAmount,
      distributions,
      netAuthorAmount: distributions.authorShare,
      currency: revenue.currency,
      date: revenue.date
    };
  }

  /**
   * Get rights portfolio for a publishing project
   */
  async getRightsPortfolio(publishingProjectId: string): Promise<RightsPortfolio> {
    const project = await prisma.publishingProject.findUnique({
      where: { id: publishingProjectId },
      include: {
        contracts: true,
        rightsTransactions: true,
        salesData: true
      }
    });

    if (!project) {
      throw new Error('Publishing project not found');
    }

    // Calculate copyright expiration (life + 70 years in most jurisdictions)
    const copyrightExpiration = new Date();
    copyrightExpiration.setFullYear(copyrightExpiration.getFullYear() + 70);

    // Determine available rights
    const allRightsTypes = ['film', 'tv', 'translation', 'audio', 'foreign', 'subsidiary', 'merchandising'];
    const soldRights = project.rightsTransactions.map(rt => rt.rightsType);
    
    const availableRights = allRightsTypes
      .filter(right => !soldRights.includes(right))
      .map(rightsType => ({
        rightsType,
        territories: ['worldwide'],
        status: 'available' as const,
        estimatedValue: this.estimateRightsValue(rightsType, project)
      }));

    // Active contracts summary
    const activeContracts = project.contracts
      .filter(contract => contract.status === 'active' || contract.status === 'signed')
      .map(contract => ({
        contractType: contract.contractType,
        party: contract.publisher?.name || 'Unknown',
        startDate: contract.effectiveDate || contract.signedAt || contract.createdAt,
        endDate: contract.expirationDate,
        value: contract.advance,
        status: contract.status
      }));

    // Revenue history
    const revenueHistory = project.salesData.map(sale => ({
      date: sale.date,
      source: `${sale.platform} - ${sale.format}`,
      amount: sale.royaltiesEarned,
      currency: 'USD'
    }));

    // Calculate total lifetime value
    const totalRevenue = revenueHistory.reduce((sum, rev) => sum + rev.amount, 0);
    const totalAdvances = project.contracts.reduce((sum, contract) => sum + contract.advance, 0);
    const totalLifetimeValue = totalRevenue + totalAdvances;

    return {
      publishingProject: project,
      copyrightStatus: {
        isRegistered: !!project.copyrightYear,
        registrationNumber: undefined, // Would be stored in copyright registration table
        registrationDate: undefined,
        expirationDate: copyrightExpiration
      },
      availableRights,
      activeContracts,
      revenueHistory,
      totalLifetimeValue
    };
  }

  /**
   * Generate contract templates
   */
  generateContractTemplate(
    contractType: string,
    jurisdiction: string = 'US'
  ): string {
    const templates = {
      book_deal: `
BOOK PUBLISHING AGREEMENT

This Agreement is entered into on [DATE] between [AUTHOR NAME] ("Author") and [PUBLISHER NAME] ("Publisher").

1. GRANT OF RIGHTS
Author grants to Publisher the exclusive right to publish the Work titled "[BOOK TITLE]" in the following formats: [FORMATS] in the territories of [TERRITORIES].

2. FINANCIAL TERMS
- Advance: $[ADVANCE_AMOUNT] payable as follows: [PAYMENT_SCHEDULE]
- Royalties: [ROYALTY_RATES]
- Publisher's share of subsidiary rights: [SUBSIDIARY_PERCENTAGE]%

3. DELIVERY AND ACCEPTANCE
Author shall deliver the completed manuscript by [DELIVERY_DATE]. The manuscript shall be approximately [WORD_COUNT] words.

4. COPYRIGHT
Copyright in the Work shall remain with the Author. Publisher shall publish all copies with appropriate copyright notice.

5. REVERSION
Rights shall revert to Author if the Work goes out of print and Publisher fails to reprint within [TIMEFRAME] of written notice.

[Additional standard clauses would follow]
      `,
      
      film_option: `
FILM/TV OPTION AGREEMENT

This Option Agreement is entered into between [AUTHOR NAME] ("Owner") and [PRODUCTION_COMPANY] ("Optionee").

1. OPTION GRANT
Owner grants Optionee an exclusive option to acquire motion picture and television rights to the literary property "[WORK_TITLE]".

2. OPTION TERMS
- Option Period: [DURATION] months from execution
- Option Fee: $[OPTION_FEE]
- Purchase Price: $[PURCHASE_PRICE] if option is exercised

3. EXERCISE OF OPTION
Optionee may exercise this option by written notice and payment of the Purchase Price before expiration.

4. RIGHTS INCLUDED
Rights include theatrical, television, streaming, and ancillary rights worldwide.

[Additional standard clauses would follow]
      `,

      translation_rights: `
TRANSLATION RIGHTS AGREEMENT

This Agreement grants translation rights for "[WORK_TITLE]" between [ORIGINAL_PUBLISHER] and [FOREIGN_PUBLISHER].

1. RIGHTS GRANTED
Exclusive right to translate and publish the Work in [LANGUAGE] for the territory of [TERRITORY].

2. FINANCIAL TERMS
- Advance: [CURRENCY][AMOUNT]
- Royalty: [PERCENTAGE]% of net receipts
- Minimum guarantee: [CURRENCY][MINIMUM]

3. DELIVERY
Translation to be completed within [TIMEFRAME] of execution.

4. QUALITY STANDARDS
Translation must maintain the artistic integrity and commercial appeal of the original work.

[Additional standard clauses would follow]
      `
    };

    return templates[contractType as keyof typeof templates] || 
           'Standard contract template not available for this type.';
  }

  /**
   * Monitor rights expirations and renewals
   */
  async getExpiringRights(authorId: string, daysAhead: number = 90) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysAhead);

    const expiringContracts = await prisma.publishingContract.findMany({
      where: {
        publishingProject: {
          authorId
        },
        expirationDate: {
          lte: expirationDate
        },
        status: {
          in: ['active', 'signed']
        }
      },
      include: {
        publishingProject: true,
        publisher: true
      }
    });

    const expiringRights = await prisma.rightsTransaction.findMany({
      where: {
        publishingProject: {
          authorId
        },
        endDate: {
          lte: expirationDate
        },
        status: 'active'
      },
      include: {
        publishingProject: true
      }
    });

    return {
      expiringContracts: expiringContracts.map(contract => ({
        id: contract.id,
        projectTitle: contract.publishingProject.title,
        contractType: contract.contractType,
        publisher: contract.publisher?.name,
        expirationDate: contract.expirationDate,
        daysUntilExpiration: contract.expirationDate 
          ? Math.ceil((contract.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        recommendedAction: this.getRecommendedAction(contract)
      })),
      expiringRights: expiringRights.map(rights => ({
        id: rights.id,
        projectTitle: rights.publishingProject.title,
        rightsType: rights.rightsType,
        territory: rights.territory,
        grantee: rights.granteeName,
        expirationDate: rights.endDate,
        daysUntilExpiration: rights.endDate
          ? Math.ceil((rights.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        estimatedValue: this.estimateRightsValue(rights.rightsType, rights.publishingProject)
      }))
    };
  }

  /**
   * Generate rights valuation report
   */
  async generateValuationReport(publishingProjectId: string) {
    const project = await prisma.publishingProject.findUnique({
      where: { id: publishingProjectId },
      include: {
        salesData: true,
        contracts: true,
        rightsTransactions: true
      }
    });

    if (!project) {
      throw new Error('Publishing project not found');
    }

    const totalSales = project.salesData.reduce((sum, sale) => sum + sale.unitsSold, 0);
    const totalRevenue = project.salesData.reduce((sum, sale) => sum + sale.royaltiesEarned, 0);

    const valuations = {
      filmRights: this.calculateFilmRightsValue(project, totalSales, totalRevenue),
      translationRights: this.calculateTranslationRightsValue(project, totalSales),
      audioRights: this.calculateAudioRightsValue(project, totalRevenue),
      merchandisingRights: this.calculateMerchandisingValue(project, totalSales),
      totalEstimatedValue: 0
    };

    valuations.totalEstimatedValue = Object.values(valuations)
      .filter(val => typeof val === 'number')
      .reduce((sum, val) => sum + val, 0);

    return {
      project: {
        title: project.title,
        genre: JSON.parse(project.genre),
        wordCount: project.wordCount,
        publicationStatus: project.status
      },
      performance: {
        totalSales,
        totalRevenue,
        averageRating: 4.2, // Would come from review aggregation
        marketPresence: totalSales > 10000 ? 'strong' : totalSales > 1000 ? 'moderate' : 'emerging'
      },
      rightsValuations: valuations,
      recommendations: this.generateRightsRecommendations(project, valuations)
    };
  }

  /**
   * Private helper methods
   */
  private generateRegistrationNumber(country: string): string {
    const prefix = country === 'US' ? 'TXu' : 'CR';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  private calculateCopyrightFee(workType: string, country: string): number {
    const fees = {
      US: { text: 65, audiobook: 85, ebook: 65, compilation: 85 },
      UK: { text: 90, audiobook: 120, ebook: 90, compilation: 120 },
      CA: { text: 50, audiobook: 75, ebook: 50, compilation: 75 }
    };

    return fees[country as keyof typeof fees]?.[workType as keyof typeof fees.US] || 65;
  }

  private updateProjectRightsStatus(projectId: string, rightsType: string, status: string) {
    // In a full implementation, this would update a separate rights tracking table
    // For now, we'll just update the main project status if it's a major rights deal
    if (['film', 'tv'].includes(rightsType) && status === 'sold') {
      return prisma.publishingProject.update({
        where: { id: projectId },
        data: { rightsStatus: 'sold' }
      });
    }
  }

  private calculateRevenueDistribution(revenue: RevenueDistribution, contract: any) {
    const agentCommission = revenue.agentCommission || 0.15; // 15% standard
    const publisherShare = revenue.publisherShare || 0; // Varies by contract
    
    const agentAmount = revenue.grossAmount * agentCommission;
    const publisherAmount = revenue.grossAmount * publisherShare;
    const authorShare = revenue.grossAmount - agentAmount - publisherAmount;

    return {
      grossAmount: revenue.grossAmount,
      agentCommission: agentAmount,
      publisherShare: publisherAmount,
      authorShare,
      currency: revenue.currency
    };
  }

  private estimateRightsValue(rightsType: string, project: any): number {
    const baseValues = {
      film: 50000,
      tv: 25000,
      translation: 5000,
      audio: 10000,
      foreign: 3000,
      subsidiary: 2000,
      merchandising: 15000
    };

    const genreMultipliers = {
      fantasy: 1.5,
      'science fiction': 1.4,
      mystery: 1.2,
      romance: 1.1,
      literary: 0.8,
      thriller: 1.3
    };

    const baseValue = baseValues[rightsType as keyof typeof baseValues] || 1000;
    const genres = JSON.parse(project.genre || '[]');
    const multiplier = genres.reduce((max: number, genre: string) => 
      Math.max(max, genreMultipliers[genre as keyof typeof genreMultipliers] || 1), 1);

    return Math.round(baseValue * multiplier);
  }

  private calculateFilmRightsValue(project: any, totalSales: number, totalRevenue: number): number {
    let baseValue = 25000;
    
    if (totalSales > 100000) baseValue *= 3;
    else if (totalSales > 50000) baseValue *= 2;
    else if (totalSales > 10000) baseValue *= 1.5;

    const genres = JSON.parse(project.genre || '[]');
    if (genres.includes('fantasy') || genres.includes('science fiction')) {
      baseValue *= 1.5;
    }

    return baseValue;
  }

  private calculateTranslationRightsValue(project: any, totalSales: number): number {
    const languageMarkets = {
      spanish: 8000,
      french: 6000,
      german: 7000,
      italian: 4000,
      portuguese: 5000,
      japanese: 10000,
      chinese: 12000,
      korean: 6000
    };

    const salesMultiplier = totalSales > 50000 ? 2 : totalSales > 10000 ? 1.5 : 1;
    
    return Object.values(languageMarkets).reduce((sum, value) => sum + value * salesMultiplier, 0);
  }

  private calculateAudioRightsValue(project: any, totalRevenue: number): number {
    let baseValue = 15000;
    
    if (totalRevenue > 100000) baseValue *= 2;
    else if (totalRevenue > 50000) baseValue *= 1.5;

    return baseValue;
  }

  private calculateMerchandisingValue(project: any, totalSales: number): number {
    const genres = JSON.parse(project.genre || '[]');
    
    if (genres.includes('fantasy') || genres.includes('science fiction')) {
      return totalSales > 100000 ? 50000 : totalSales > 50000 ? 25000 : 10000;
    }
    
    return totalSales > 100000 ? 15000 : 5000;
  }

  private getRecommendedAction(contract: any): string {
    const daysUntilExpiration = contract.expirationDate
      ? Math.ceil((contract.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysUntilExpiration <= 30) {
      return 'URGENT: Contact publisher about renewal or reversion';
    } else if (daysUntilExpiration <= 90) {
      return 'Begin renewal negotiations';
    } else {
      return 'Monitor and prepare for renewal discussion';
    }
  }

  private generateRightsRecommendations(project: any, valuations: any): string[] {
    const recommendations = [];
    const totalSales = project.salesData?.reduce((sum: number, sale: any) => sum + sale.unitsSold, 0) || 0;

    if (totalSales > 50000 && valuations.filmRights > 75000) {
      recommendations.push('Strong candidate for film/TV adaptation - consider engaging entertainment agent');
    }

    if (valuations.translationRights > 30000) {
      recommendations.push('Explore international translation opportunities, particularly for high-value languages');
    }

    if (totalSales > 25000 && !project.rightsTransactions?.some((rt: any) => rt.rightsType === 'audio')) {
      recommendations.push('Consider audiobook rights - strong market demand in your genre');
    }

    if (recommendations.length === 0) {
      recommendations.push('Focus on building readership before pursuing subsidiary rights deals');
    }

    return recommendations;
  }
}

export default new RightsManagementService();