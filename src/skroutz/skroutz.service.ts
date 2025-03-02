import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SkroutzService {
    constructor(private readonly httpService: HttpService) {}

    private commonHeaders = {
        'Host': 'api.skroutz.gr',
        'X-Language': 'el',
        'Accept': 'application/vnd.skroutz+json;version=3.88',
        'Authorization': 'Bearer yI82tqmMnOhE6KvWyghSa1tBxZwIEdrWPCkenLWE7TFdxruU4E-mAG9FHo7Bdf7Tdk7k6IpZzwSmNDy2QWcFIQ==',
        'X-Region': 'GR',
        'Accept-Encoding': 'br;q=1.0, gzip;q=0.9, deflate;q=0.8',
        'Accept-Language': 'el-GR;q=1.0, en-GR;q=0.9',
        'X-PrivacyPolicy': 'essential|performance|preference|targeting',
        'Content-Type': 'application/json',
        'User-Agent': 'skroutz.app/6.47.0.3103 (IOS/18.3.1)',
        'Connection': 'keep-alive',
        
    };
    async getProductDetails(skuId: number): Promise<{ webUrl: string; specs: string; productImages: string[] }> {
        const url = `https://api.skroutz.gr/skus/${skuId}`;
        try {
    
            const response = await firstValueFrom
            (
                this.httpService.get(url, { headers: this.commonHeaders }),
            );
          
            // Extracting required details
            const productData = response.data.sku;
        
            return {
                webUrl: productData.web_uri,
                specs: productData.plain_spec_summary,
                productImages: [productData.images.main, ...productData.images.alternatives],
            };
        } catch (error) {
          throw new Error(`Error fetching product details: ${error.message}`);
        }
    }
    async fetchCategoryIdAndFilters(query: string) {
        // 1) Call the first endpoint
        const firstUrl = `https://api.skroutz.gr/global_search?include_meta=1&oms=1&osi=0&otp=%CF%84%CE%B7&otto=1&q=${encodeURIComponent(query)}`;        

        const firstResponse = await firstValueFrom
            (
            this.httpService.get(firstUrl, { headers: this.commonHeaders }),
        );

        // 2) Extract the category id from the first response
        const categoryId = firstResponse.data?.params?.action?.attributes?.id;
        // e.g. 12

        // 3) Call the second endpoint using the categoryId
        // Note: encode the categoryId properly (though it's usually just a number).
        const secondUrl = `https://api.skroutz.gr/categories/${categoryId}/skus?include=category%2Cthumbnail_variations&include_meta[]=available_filters&include_meta[]=applied_filters&include_meta[]=applied_price_filters&include_meta[]=filter_groups&page=1&support_sections=1&user_changed_filters=false`;

        const secondResponse = await firstValueFrom(
        this.httpService.get(secondUrl, { headers: this.commonHeaders }),
        );

        // 4) From the second response, we want to parse the filters
        //    Typically, the data is inside secondResponse.data.meta.filter_groups
        const filterGroups = secondResponse.data?.meta?.filter_groups || [];

        // Build a flat list of filters in the shape { filterName, filterId, filterGroupName }
        const filters = filterGroups.flatMap((group: any) => {
        // Each group has an array of 'filters', each filter has an 'id' and 'name'
        if (!group.filters) return [];
        return group.filters.map((f: any) => ({
            filterName: f.name,
            filterId: f.id,
            filterGroupName: group.name,
        }));
        });

        // 5) Return whatever structure you need
        return {
        categoryId,
        filters,
        };
    }

    /**
   * Example function:
   *  - Accepts categoryId and an array of filter IDs
   *  - Calls the second endpoint for all available pages
   *  - Returns a flat list of all products
   */
  async fetchAllProductsByFilters(categoryId: number, filters: number[], priceMax: number, priceMin: number): Promise<any[]> {
    const commonHeaders = {
      'Host': 'api.skroutz.gr',
      'X-Language': 'el',
      'Accept': 'application/vnd.skroutz+json;version=3.88',
      'Authorization': 'Bearer yI82tqmMnOhE6KvWyghSa1tBxZwIEdrWPCkenLWE7TFdxruU4E-mAG9FHo7Bdf7Tdk7k6IpZzwSmNDy2QWcFIQ==',
      'X-Region': 'GR',
      'Accept-Encoding': 'br;q=1.0, gzip;q=0.9, deflate;q=0.8',
      'Accept-Language': 'el-GR;q=1.0, en-GR;q=0.9',
      'X-PrivacyPolicy': 'essential|performance|preference|targeting',
      'Content-Type': 'application/json',
      'User-Agent': 'skroutz.app/6.47.0.3103 (IOS/18.3.1)',
      'Connection': 'keep-alive',
    };

    // Build a portion of the query string for the filters
    // e.g. filters[]=-709&filters[]=1165169&filters[]=-828
    const filterQueryPart = filters
      .map((f) => `filters_ids[]=${encodeURIComponent(f)}`)
      .join('&');

    // We will need to loop across pages until we get them all
    let page = 1;
    let totalPages = 1;
    const allProducts: any[] = [];

    do {
        const url = `https://api.skroutz.gr/categories/${categoryId}/skus` +
            `?include=category%2Cthumbnail_variations` +
            `&page=${page}` +
            `&support_sections=1` +
            `&user_changed_filters=false` +
            `&price_min=${priceMin}`+
            `&price_max=${priceMax}`+
            (filterQueryPart ? `&${filterQueryPart}` : '');

        const response = await firstValueFrom(
            this.httpService.get(url, { headers: commonHeaders }),
        );

        // Pagination info
        const pagination = response.data?.meta?.pagination;
        totalPages = pagination?.total_pages ?? 1;

        // Get sections and find the one that contains SKUs
        const sections = response.data?.sections || [];
        const listingSkusSection = sections.find((section) => section.type === 'listing_skus');

        // Collect each SKU item and extract required fields
        if (listingSkusSection?.items) {
            for (const item of listingSkusSection.items) {
                const sku = item.attributes.sku;
                if (sku) {
                    allProducts.push({
                        id: sku.id,
                        display_name: sku.display_name,
                        reviews: sku.reviews_count,
                        price: sku.price_min,
                        specs_summary: sku.plain_spec_summary,
                    });
                }
            }
        }
        page++;
    } while (page <= totalPages);

    return allProducts;
  }
}