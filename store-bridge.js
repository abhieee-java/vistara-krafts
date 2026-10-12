/**
 * Resin Art Memories × Vistāra Krafts Studio
 * Unified Customer Storefront State, E-Commerce Engine & Host-Push / Supabase / Cloudflare Bridge
 * Instagram: https://www.instagram.com/resin.art.memories?utm_source=qr
 */
(function (global) {
  'use strict';

  const STORAGE_KEYS = {
    CART: 'ram_vk_cart_v1',
    WISHLIST: 'ram_vk_wishlist_v1',
    SAVED_POSTS: 'ram_vk_saved_posts_v1',
    LIKED_POSTS: 'ram_vk_liked_posts_v1',
    PRODUCTS: 'ram_vk_products_v1',
    SOCIAL_POSTS: 'ram_vk_social_posts_v1',
    ORDERS: 'ram_vk_orders_v1',
    PINCODE: 'ram_vk_pincode_v1',
    COUPON: 'ram_vk_coupon_v1',
    GST_INFO: 'ram_vk_gst_v1',
    QUIZ_PREF: 'ram_vk_quiz_pref_v1',
    PATRON_PROFILE: 'ram_vk_patron_profile_v1',
    AUTH_SESSION: 'ram_vk_cf_auth_v1',
    REGISTERED_USERS: 'ram_vk_cf_users_v1',
    RECENTLY_VIEWED: 'ram_vk_recently_viewed_v1',
    STUDIO_SYNC_LOG: 'ram_vk_studio_sync_v1'
  };

  // Verified studio & product photography from the Stitch archive
  const IMAGES = {
    logoVistara: './vistara-krafts-logo.jpg',
    logoPotry: 'https://lh3.googleusercontent.com/aida/AEtjO1UL_yv7CTSIh8DKMJSJyoEYV6KxkBv-vKrFle0GDCkSpaAqW6NgAOHRFgnmdA8w4H2gwXZOcRM-pCA3X5qDVsa1CQTVwxmaMPMsdc2iRpZlnIY37B_Odr_E0inLU4jSiTjX-EQA0Agmjtt1KTwPei-xB5SFz-_Vz8FO8ZaxhrSn_qoOWRpZzE0n60032HCsmPdzpGhw6WMTp64N4O1PkEPVu-x-tvp-wjJtQkxP3sXTtaDy59arIJ3cDp2L',
    avatarPatron: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEfH5pmgXdOI0mnnN25k9DHn4iZNDO6wW_YERKWNba2tdwUuopMefjulnjWQYyOtpO5PbWkiW9CmteZIRsPaPSZtGU_1WhgAGSj2NWg7e-8uCvKEkCHAWRLBPtIQYKdVhEDObJsA5letw3AbZTj1f26XSfoItEh4s-fkfu0rzR5lKs8brHwg-aa_t4YvHAzr7zuSxFyPvlwlBRY3wtWrTwqKk9Bpf3wOErpjYhoS0BYtQqpSjFGEvDig',
    floralCube: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXW-CtxPaQNBpLYiDkZiAh_3HctPzR3wSCDa6iBBPevbe8OYTRQh3MBrygeRClgewcRXZmXbGFcwCAJ8voXhr1Gis32c3Xd7f9MpmY8HuxABgInUPnavbPeSPIZtwzwMcmwPtXzx7Z63sTUGuH0-iZ0MPSphmGmleYJW3_njEtUfcbKOPB1icNTEcuIPrr9seRXtiWbBpXV0TUCSnKGRmIqqDcgv5vapJcyIzP8GkKndOeGidcCWTJWg',
    jewelryBezel: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASdeQkmmEQPW1Z1FyFDZPlt23GxEkA8qw-6gKoevLZuY8N4qtgN57MB84sc4y-C75qu3m8ZM_U-BxwLhYMruaXqI5K-9mJhbsKj2LFJr4EpbT4A95tXrmqdaBaIjaIQF2LST_9XGeT7fwu1uKsQVQnCfzYQg5S_JXVGkfisqaGm9DXUD_ByN6qw9ALWJ-YGOsHiDgGXipcupCHC6FdeJJTqCLfvSjRGbT5E0ecbxW5lPpBED8lSQlSRQ',
    coasterSet: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsuKGlgeujHuiaSQZYD5K6m5pg8ytyYXi0H5vJHZe16JcOZ6svtWNiWU-mfxqfk50B69TOKcCuP7J6f3k23HD_e3dxYrJDJtnL5X0iAaVvGJ04gmvEtD3Tthf9RTj4zbo3zgxswTFcX2Bebgm9l1SgfA-srRH4LMuzyDqwJa-Y3zduspBI9VQK8JPLTTUr40gJUzZVE-LhN-k9ek2ki2kGuvpJC790Xs6K040523SkYk-rhQV_IStqIg',
    oceanWave: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjzZFFaUlhkp3iunRIf4XTsGHQEnqYHu6pE65tBztKE7OolcCbUmdQivWEjR7Iw3kWILrY-SOL_WmRhZu9EvoUpa07FYLMMcOX4LFL9SAM8vS0iiyzGKVHV5g1yGZRA_heWpGcVykSqFyKi5Nq-kqaEqzkN_BuB4tzxCuGgOjGh1ChjcyrLAFbKcMMvhAQ2MxMA05f5fuhuKzbs1o3iByY2g2xxrgf7FqrVQmZOtXXHtlmMiEzdzwMjQ',
    geodeCanvas: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8cz82Qgt63X11PW-NF0BP3BK10qS00sh3LcoIFfylPxnOCd_ulVRhrI58Ms6bzijA-vM_HfUG0IIFHdpDCTYC40_A5Qxc8VlBEgemP5Ylp5_Bkb7xyt20aiMk9cq23_g8Pllm6ObQyqRCRDYVfM5iFG9Rze05F1405nzoC9vGogMjnnY-K4qpPb0ZIDtOTFtPODyRFBdyVOGYU5-plWn-1Mp-QGmX0Dcnufa9wOT7J7EE2ITnEaJ9mw',
    riverTable: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVZ1vB45YWVjK0W4fMNGjw_QSz0ZlQbt6dWPHPnvtzqYLCn9msP_EdC9KD1007bWb2sD3mFCtvV7pPy0B-gdCUmOm4pwNb56xsKyGI5hhpbN0RRsSKICHspRvKOO8RLg5xYRvGhPtjeChcyxBnp7EtmG9ZVj8W-Nxw9hZjkKu1eUdAPpQ-_Nqt7BEaFxdHJCbjgOWzXqTc_TrNxhAOvFZ_bwUALL8CXHbh8Wbzz1sEQUOl5rF-ltu43g',
    ultraclearMain: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRDycw3YoY4kwqRgc2RIKed3egGLaRRPS-s_Rj31II52yPo9mDwes-hs9trRWTLBtNK3kTpXaTRhlSVuTdOCl9dbdO_WTG2X7GPf1I7HYJSKSGD-a3Fgl7B6c8ro6jp7dFha0mHMnnRi-QtFlnFZ4ndGGuGaiAFgz667F1dX9gmHFfhqzuZqqbfuY7BUnC2X8WuzXjYz_F6yqBPS7AOMwiLvJ_ZgwVyGjt1XfOSW2V6nLeNup72rQpSw',
    ultraclearThumb1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQWPIc9RjjOm562dw3ddz6mENg7B79L8sE2vd8DXSPWjCkWBCtZKyexl_l-8s30_zToPodAS1phxSqY0nnzQm46KbX4zIIlWVcqAMUZUxTu8aXo6wvOhzgnrtxzNhJ4p8IcsNDvujKOfqx2bD5zxFyCTJsxlJllbFak3BCMsI5-K6pHgOq8f1YZRylmTnljwQMFSsYaT7CYTXj6yxL5v6Vo4kMOGvNksBROF_YEXqD2-Fp9Y88Nea_xg',
    ultraclearThumb2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmtDwFwE9dI4651IT8Cp51-KbxaO8kyaG1KWkJJfY6So_X7JydXTJGJYxcqFHm4qFRVfdLRiQCgDlTa3BnhgAhwu9vgXxvNtgkzk1wC10cAiYPPUvn4R1zy57bSpVpejzjN9U0krunXqre8ZXUetkJW2eVwtU20ubwTUkLJdgBuoClanQobEINLZHxgNqYmZwdhu85NX_SOJkHxK7AO7HPqaTlflxNzIgv1HuAUXZnmVwry2iGcQcGkg',
    ultraclearThumb3: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkroz5hIPjPYisInSbhSaH6GGWT5c69cF66lGSYiMLZxKLTdEp46j7K0ZNRFrWxqjcMAyJALQRq5BwfeOLdjvhy6m-87tfKJQ9vAy00Y8GHQmI-8SCiaqGW2KgbejJjorqxJwUIQarDMnE-X88JfDD5EStpvETeg1NWUEIEh449YfqUGpKoiWl-mjZsyySo2XEk4EecUjs2uatr0YqyVnOjo6cT4BpwIwLcOCk-iXHBMMpFJ1nfc2_nw',
    ultraclearThumb4: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdvPZuR6YS_G_8p9poYabe8eAhEapid_YXjI0B_Jk8UPPPJz5jkFfgGp7i84_5vUjZU2LKgNwgyUjZwUrQp9u0E5JFnGvTFLhDTX6lqx4qH7uLKQZQKTMHRuZdrokjEPAIw0DHVIubmGXta72_SNZg0gQtfIOh_S-uBtYQreovIq9DpZpkmWl7HRNQ8YHcWRkSflNk0Zrugt1jnHxsk3TzgI2YTwUzpU8PusCBVvtfKohphqv7Uz7Z2Q',
    deepPour21: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5W0RxlC_qbCLiogOunZQJLwCIARNblOCu547tssvch4KcHjyQidb2Pqj42y6UPDqVUOLtfhsZVKJ8Hdx30t3WMpTJe11isaKisC_alp6Yk49cvuJIipcEzkaIHBWHiU3QefrMpytDplh-cEsce41ZOUIUGDrb6TPU5xXCEnrqTzHokQTZ0HjkbBevAv4o_E-JsEjGeJa0dnZWvbyMV104YVX9OokN7wPg58kHdnJCLaBPTQSPbqa_dg',
    doming11: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqlb7IBVOOKGQdlkshli66LfxK7ksTEDNrC0A4BuDzUBO4egoX6orddeLfRtAR6L_5SLGg5BSHYvThMgNhOA5h5Cfga6As7bsfs42pWHzk9CuzEhGL9lTfiWedVZZ1HJ96wchvuWBMJT_g7ZpK_ahAx-rhIN-uGz208_cF4LpKNbL_Ur9lD_Ci4rW3HXnyRrTA99WnfyljdtAa2j0MwdsUdmMZsGkf-uFYPKv4-nhR9XRnHNogow_I7w',
    quickSet11: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbnasnTSVLu2hYLiKrH6kzNDqjHUkXxfpcPPeLilSr7B48NPpbAxdm6E02JNZ03Xky30q9AeiEspvr-xXV5QWjAozM3lC1rzEjTywCCPZdThUrSzTFGrIFXLU6N6RrNiUgljvEX1kFPdEJcC5ABZSjwrAJDXtNhIIlhDiHyq6PmdhLjksG_focqOi7ob6FHBeABTUhzAHiK1AdQDGF4ilUmnlSic3H_Fb1GHUMjeTS8FncO2-d75qL6w',
    uvHard: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWu96XXw_-a6fZfaVzPObJ7VcVkqEVYlCBb3_3E1N3M9-80ipFCOkRbb2f6AlfdeClKEwuX6KY1oL-YpWsi-pw_ymNDNTKelCiwpi5ki3KFW0VF7hXZdrc4skHdyVj1EQPRt6v4znohGzQcEZs4pCiqtEJ3fJv3RRzUwfsB2AFFJZIFyxk054ZJ33xk4OLEvOkO9jMLm4ZfN6xNvY9bz2YNuMgOAq75Nu-IcUyL2OzokyvipFhtmN_8w',
    micaChameleon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsHygVQDC1PnFOM3bOHAJacAtodwre1FixR4hSycrhmG-F77MrskbkW2XcwL7ueawATyKCEyn1zGfWKW0u4qlBpzlo9yLqgRIf9YKzhrXNqcNxOLaCw_ID7b39Paw4KsYdkznjBV6kZikiaukQlA9VARAbHMFh-CQzYhth8LjrvcUWUFDvsv5EP0cq8ahNhihjMYhugsBrImA5bh9A-aPrJGVio28WEyvpUTiav1TvqOVONuJ4CbYZCQ',
    ecoBio: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANQCZGg-SkRfOiXEX6GoK6R4JzoffbtS_-7ihkpfk4_6-PKbJfeycqVeNBorpqLKkHT8CSN8LLwnh5CFJkrlxowWNHnIL6oM0K3DLLzDTKgChRABfAZTPZsFqnaPto_gXdT9h_JmHNBteQGsjQpvjPdu94oKru9YzOyxlvOIyUZ9kMEz62WOHFaWNkCQBR91aoBGnVdjOafD3h1rjhU9BDEUqtzPIKS5XWzvFd6vpslHLZEzLjC5hA8Q',
    geodeMold: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALJpk3c80a1Mrf3flcRflAc828a5vcaeDV9qEpcoBm1MbDH4Y-bxGb74HPWWhNakHOEuqyW5O13zPv1s3-qmZzS8Do6MFzTpA6iF5syIOWNkt0GFBYmnLlfqBsq0BKW01eDGhAzky-UlNqL-HNmdBYEmNx5CeziUnLuAH8tovtJpetmWIK7eaibXjdWY1rHHnuoP9knfzaZ3_HrEZF6juyZi8Cv38pE2bJy5E_JfMtRMoqkkt7zFKLpA',
    siennaPitcher: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4v5UEoHMPUfjyZvw-pRB5rieXSJVcdqHO5bwDOia0NN0jpnEQZRqGdhiZnBw5FQ2yiK4mTV7_APtHo1HJq94rbc1bRq_Y5OUjiheJZSNo3h9e5XpGNVQsbfnMDtASMIoLWPHI4SVHVtNyZmNRkEzf5-Fggr6BkQ57D-g2NKbtWLpS7Q6OKGh5oWQQfxdadZNLHLGqEfv1F98rtipSdWG3XCVAo73iFagCjml30rbmzqI81c5YxGjoAw',
    siennaSpout: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-EJ1o1ePHpsz_O8r-Ik9eOFMyJRNsgMm96ZbZdCAZqAgrxJBJh3DX6gGdCUR-EJxf8_I--NSskOUfi_iqs_Cv2DYHhk8tdZdXwZcIFuTS3ysh-Jm8cxdO_Ft71jKUjtZdlAcyAam4_RYy3HJRGnGwCXQgLeYUFfQILDID-xUx4HY5MjksU80HKSXfEups8Yafyz1_7HlrqiW8p77Jlogu-213R9fmmPBfq9MmJeSfKD_xCN1Z7TM0Hg',
    siennaTable: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBnNxDST6TF_hJ4W9GT9nTVXG_271qfy4djrhvCFPEM3yQoyNOSKRCpk1BMiTeKP-w_h1rAZgCK_5EO5Ms-8upoZhtGku0aNIF25aENPF4BKBggOHk9yOUqUNLZQm8J1QYAKOnnNYiqzkcjA0DI5STfc4iwQtXb9MMr_u2n_u6bPRPNjNkT9G-jk92O-QxgQrrHYyV3hAIRNqr67zlvUfbqZlS-h98ogVUkxufmiDfT9AX0r-DeUe_xg',
    siennaStamp: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-3yjdCvZfDryc1Y0tgNw_J_Pt26rjf0w-jHczKYeSKIeXR-wXkZvoQW2CcbCxBdCc_mJkJo_tkon4isgXwUTWVP1gFoYT4Si1iU9rjmWWi5N0lU8qtjKGuHZG0nOMNXB2RXHoQA4PzC6ROibYI0Od1NGz6hdAr-E9jKpWQ_cWn9eWRtTGDi0ztXVkB98hrjPhRixK06TocWZnBrN0M6GA_XOkWs30yrjAxAksend7s4YoIWNaleHu3w',
    oceanMicaJar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR2fNybe2S7ETdDIR2E5TctJDdHepjAMeq0qTSs_XGpEKEUOlL3gw_8cBxwtXoiS2ZNX9uUtBwU82leSsjwvpXkVwSoa5mLDTm5MxuTxLkP9aXwO7xX4ymWgORnLYcCT2aA2QqPLzllinMpy7nC-Z_c4JMp9gb8JVMeXtlVpr6zGIMADlqD84MYeEtTe2cLA7DIzN1tP6T9FvCg5Z6sjMthqahJbxzBX6h6ZoNawRZV2xByGmFTuKfpQ',
    siliconeMold4x: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2ZTMF-WsUhnpK0cw0PI3jx7iyCBNcRQMBPZv0TZZnbDiSZQpUubqRmRqF9oAzyjLtW8TGShVhC0p7zZ3A6M6wloNYrVJTfR3SOfSeDMn0g7AaOnzKXd4UV0kt-9HKzT9AXamagVHVH5FQQeAJgcCRwc5z2BjUJ8Vq0HCt9GMBkcO2RU81_TMAA6mRy0XHh2ivX2txHiD8BhNa_nCMFXNhmT8xOdWZAN_5zYRHdj-CYhQP0e8u3itN_g'
  };

  const DEFAULT_PRODUCTS = [
    {
      id: 'ram-keep-001',
      sku: 'RAM-VRM-BLK-12',
      name: 'Eternal Varmala & Bridal Bouquet Time-Capsule Block',
      shortName: 'Eternal Varmala Resin Block',
      subtitle: 'Museum-Grade 50mm Deep Optical Cast with 24K Gold Leaf & Custom Brass Calligraphy',
      category: 'keepsakes',
      subCategory: 'floral_preservation',
      relatedCategories: ['deep_pour'],
      badge: 'IG Viral Keepsake',
      price: 4499,
      regularPrice: 5499,
      unitPriceLabel: 'Free Floral Pickup',
      ratio: '2:1',
      viscosity: 'low',
      pourDepth: '50mm',
      cureTime: '72h',
      potLife: '90m',
      rating: 5.0,
      reviewsCount: 418,
      inStock: true,
      isCustomizable: true,
      image: IMAGES.floralCube,
      gallery: [
        IMAGES.floralCube,
        IMAGES.ultraclearThumb2,
        IMAGES.jewelryBezel,
        IMAGES.coasterSet
      ],
      variants: [
        { id: 'vrm-8in', label: '8" Romantic Cube (Bridal Mini)', desc: 'Preserves 8–12 roses + couple name tag', price: 2999, regularPrice: 3699, unitPrice: '8×8×2 inch' },
        { id: 'vrm-12in', label: '12" Royal Heirloom Block', desc: 'Full Varmala + 24K gold flakes + warm LED stand', price: 4499, regularPrice: 5499, unitPrice: '12×12×2.5 inch', popular: true },
        { id: 'vrm-16in', label: '16" Gallery Mantel Frame + Coasters (2x)', desc: 'Dual garland preservation + 2 complimentary coasters', price: 6999, regularPrice: 8499, unitPrice: '16×16 inch combo' }
      ],
      specs: {
        mixRatioWeight: '2 : 1 (Deep Pour Archival)',
        mixRatioVolume: '1.8 : 1 (Degassed Chamber)',
        workingPotLife: '90 Minutes @ 23°C',
        demoldDuration: '48 Hours',
        fullGlassCure: '7 Days Silica + 72h Cure',
        dynamicViscosity: '350 mPa·s (Zero-Bubble)',
        maxDepth: '50mm – 65mm',
        hardness: '85D Scratch-Shield',
        uvStability: 'HALS + UV400 (10+ Yrs)'
      }
    },
    {
      id: 'vk-epx-301',
      sku: 'VK-EPX-301-12K',
      name: 'UltraClear 3:1 Casting Resin',
      shortName: 'UltraClear 3:1 Casting',
      subtitle: 'Optical Grade Degassed Epoxy System for Deep Art, Coasters & Floral Preservation',
      category: 'casting',
      subCategory: 'casting_3_1',
      badge: 'Bestseller',
      price: 1299,
      regularPrice: 1499,
      unitPriceLabel: '₹108 / 100g',
      ratio: '3:1',
      viscosity: 'low',
      pourDepth: '20mm',
      cureTime: '24h',
      potLife: '45m',
      rating: 4.9,
      reviewsCount: 342,
      inStock: true,
      isCustomizable: false,
      image: IMAGES.ultraclearMain,
      gallery: [
        IMAGES.ultraclearMain,
        IMAGES.ultraclearThumb2,
        IMAGES.ultraclearThumb3,
        IMAGES.ultraclearThumb4
      ],
      variants: [
        { id: 'kit-400g', label: '400g Kit', desc: '300g Resin + 100g Hardener • Small Casts', price: 549, regularPrice: 649, unitPrice: '₹137 / 100g' },
        { id: 'kit-1200g', label: '1.2kg Kit', desc: '900g Resin + 300g Hardener • Standard Studio Edition', price: 1299, regularPrice: 1499, unitPrice: '₹108.25 / 100g', popular: true },
        { id: 'kit-4000g', label: '4kg Bulk Kit', desc: '3kg Resin + 1kg Hardener • Mid Furniture & Keepsakes', price: 3799, regularPrice: 5199, unitPrice: '₹94.97 / 100g' },
        { id: 'kit-12000g', label: '12kg Commercial Pack', desc: '9kg Resin + 3kg Hardener • Architectural Casts', price: 9999, regularPrice: 12999, unitPrice: '₹83.3 / 100g' }
      ],
      specs: {
        mixRatioWeight: '3 : 1 (Resin : Hardener)',
        mixRatioVolume: '2.6 : 1 (Parts by vol.)',
        workingPotLife: '45 – 55 Minutes',
        demoldDuration: '18 – 24 Hours',
        fullGlassCure: '48 – 72 Hours',
        dynamicViscosity: '600 – 800 mPa·s',
        maxDepth: '15mm – 20mm (1.5–2 cm)',
        hardness: '82D (Diamond Finish)',
        uvStability: 'HALS Guaranteed 3+ Yrs'
      }
    },
    {
      id: 'ram-keep-002',
      sku: 'RAM-OCN-TRY-01',
      name: 'Maldives Ocean Wave Teak Charcuterie & Vanity Tray',
      shortName: 'Ocean Wave Teak Tray',
      subtitle: 'Hand-poured Multi-Layer Lacing Foam Waves over Seasoned Burma Teak',
      category: 'keepsakes',
      subCategory: 'home_decor',
      relatedCategories: ['doming'],
      badge: 'Hand-Poured Art',
      price: 2199,
      regularPrice: 2799,
      unitPriceLabel: 'Food Safe Glaze',
      ratio: '1:1',
      viscosity: 'high',
      pourDepth: '10mm',
      cureTime: '24h',
      potLife: '35m',
      rating: 4.9,
      reviewsCount: 215,
      inStock: true,
      isCustomizable: true,
      image: IMAGES.oceanWave,
      gallery: [
        IMAGES.oceanWave,
        IMAGES.ultraclearThumb4,
        IMAGES.riverTable,
        IMAGES.coasterSet
      ],
      variants: [
        { id: 'ocn-std', label: '14" Lagoon Serving Board', desc: 'Burma Teak + 3-layer ocean foam lacing', price: 2199, regularPrice: 2799, unitPrice: 'Single Board', popular: true },
        { id: 'ocn-set', label: '14" Board + 4 Ocean Coasters Combo', desc: 'Complete entertaining table ensemble', price: 3199, regularPrice: 3999, unitPrice: '5-Piece Set' }
      ],
      specs: {
        mixRatioWeight: '1 : 1 (High-Gloss Doming)',
        mixRatioVolume: '1 : 1 (Self-Leveling)',
        workingPotLife: '35 Minutes',
        demoldDuration: '12 Hours',
        fullGlassCure: '48 Hours (Food Contact Safe)',
        dynamicViscosity: '2200 mPa·s (Wave Lacing)',
        maxDepth: '8mm Surface Coat',
        hardness: '84D Heat-Resistant (75°C)',
        uvStability: 'HALS Marine Grade'
      }
    },
    {
      id: 'vk-epx-201',
      sku: 'VK-EPX-201-3KG',
      name: 'River Flow 2:1 Deep Pour River Table Epoxy',
      shortName: 'Deep Pour 2:1 Epoxy',
      subtitle: 'Ultra-Slow Exotherm Formula for 50mm Single-Pass Casts & Floral Blocks',
      category: 'deep_pour',
      subCategory: 'deep_pour_2_1',
      badge: 'Up to 50mm',
      price: 2850,
      regularPrice: 3200,
      unitPriceLabel: '₹95 / 100g',
      ratio: '2:1',
      viscosity: 'low',
      pourDepth: '50mm',
      cureTime: '48h',
      potLife: '120m',
      rating: 4.8,
      reviewsCount: 188,
      inStock: true,
      isCustomizable: false,
      image: IMAGES.deepPour21,
      gallery: [
        IMAGES.deepPour21,
        IMAGES.riverTable,
        IMAGES.ultraclearThumb2,
        IMAGES.ultraclearThumb3
      ],
      variants: [
        { id: 'dp-3kg', label: '3.0kg Dual Pack', desc: '2kg Resin + 1kg Hardener • Floral Blocks & Small Tables', price: 2850, regularPrice: 3200, unitPrice: '₹95 / 100g', popular: true },
        { id: 'dp-9kg', label: '9.0kg Furniture Studio Kit', desc: '6kg Resin + 3kg Hardener • Live-Edge River Tables', price: 7999, regularPrice: 9600, unitPrice: '₹88.8 / 100g' }
      ],
      specs: {
        mixRatioWeight: '2 : 1 (Resin : Hardener)',
        mixRatioVolume: '1.85 : 1 (Parts by vol.)',
        workingPotLife: '90 – 120 Minutes',
        demoldDuration: '36 – 48 Hours',
        fullGlassCure: '72 – 96 Hours',
        dynamicViscosity: '320 – 450 mPa·s (Water-thin)',
        maxDepth: '50mm (2 inches single pass)',
        hardness: '85D Structural Grade',
        uvStability: 'Dual HALS + Benzotriazole'
      }
    },
    {
      id: 'ram-keep-003',
      sku: 'RAM-GEO-CLK-18',
      name: 'Royal Champagne & Quartz Geode Statement Wall Art',
      shortName: 'Quartz Geode Wall Art',
      subtitle: 'Encrusted with Raw Clear Quartz Crystals, Metallic Bronze & Rose-Gold Leaf',
      category: 'keepsakes',
      subCategory: 'wall_art',
      relatedCategories: ['pigments'],
      badge: 'Collector Edition',
      price: 3899,
      regularPrice: 4699,
      unitPriceLabel: 'Natural Quartz',
      ratio: '1:1',
      viscosity: 'high',
      pourDepth: '15mm',
      cureTime: '24h',
      potLife: '40m',
      rating: 5.0,
      reviewsCount: 129,
      inStock: true,
      isCustomizable: true,
      image: IMAGES.geodeCanvas,
      gallery: [
        IMAGES.geodeCanvas,
        IMAGES.coasterSet,
        IMAGES.micaChameleon,
        IMAGES.ultraclearThumb4
      ],
      variants: [
        { id: 'geo-18in', label: '18" Round Geode Canvas / Clock', desc: 'Silent sweep brass hands + raw quartz clusters', price: 3899, regularPrice: 4699, unitPrice: '18 inch dia', popular: true },
        { id: 'geo-24in', label: '24" Architectural Statement Panel', desc: 'Backlit warm LED halo + champagne druzy rim', price: 6499, regularPrice: 7999, unitPrice: '24 inch dia' }
      ],
      specs: {
        mixRatioWeight: '1 : 1 Thixotropic Gel',
        mixRatioVolume: '1 : 1',
        workingPotLife: '40 Minutes',
        demoldDuration: '24 Hours',
        fullGlassCure: '48 Hours',
        dynamicViscosity: '3500 mPa·s (Hold-on-Edge)',
        maxDepth: '12mm Multi-Layer',
        hardness: '83D Mirror Gloss',
        uvStability: 'Archival Non-Yellowing'
      }
    },
    {
      id: 'vk-uv-hard',
      sku: 'VK-UV-HRD-200G',
      name: 'Jewelry Glass Optical UV Resin (Hard Type 365nm)',
      shortName: 'Jewelry Glass UV Resin',
      subtitle: 'Zero-Mix Instant Curing Formula for Pressed Flower Pendants & Bezel Charms',
      category: 'uv_resin',
      subCategory: 'uv_jewelry',
      badge: 'UV Instant 90s',
      price: 649,
      regularPrice: 749,
      unitPriceLabel: '₹324 / 100g',
      ratio: '1-part',
      viscosity: 'low',
      pourDepth: '10mm',
      cureTime: '90s',
      potLife: '15m',
      rating: 4.9,
      reviewsCount: 420,
      inStock: true,
      isCustomizable: false,
      image: IMAGES.uvHard,
      gallery: [
        IMAGES.uvHard,
        IMAGES.jewelryBezel,
        IMAGES.ultraclearThumb2,
        IMAGES.ultraclearThumb1
      ],
      variants: [
        { id: 'uv-100g', label: '100g Precision Nozzle Bottle', desc: 'Ideal for 25–30 botanical pendants', price: 379, regularPrice: 449, unitPrice: '₹379 / 100g' },
        { id: 'uv-200g', label: '200g Studio Twin Pack + UV Torch', desc: 'Includes 365nm mini curing lamp', price: 649, regularPrice: 749, unitPrice: '₹324 / 100g', popular: true }
      ],
      specs: {
        mixRatioWeight: '1-Part Ready to Use',
        mixRatioVolume: 'No Mixing Required',
        workingPotLife: 'Unlimited until UV Exposure',
        demoldDuration: '90 – 120 Seconds (365nm LED)',
        fullGlassCure: '3 Minutes Cool-Down',
        dynamicViscosity: '500 mPa·s (Self-Doming)',
        maxDepth: '5mm per UV Layer',
        hardness: '84D Tack-Free Surface',
        uvStability: 'Anti-Ambering Optical Grade'
      }
    },
    {
      id: 'vk-pig-cham',
      sku: 'VK-MICA-CHAM-12',
      name: 'Metallic Chameleon Mica Powder Set (12 Shades)',
      shortName: 'Chameleon Mica Set (12x)',
      subtitle: 'Cosmetic-Grade Dichroic Color-Shifting Mineral Pigments in Apothecary Jars',
      category: 'pigments',
      subCategory: 'pigments_mica',
      badge: '12 Shades',
      price: 899,
      regularPrice: 1199,
      unitPriceLabel: '₹75 / jar',
      ratio: '3:1',
      viscosity: 'low',
      pourDepth: '25mm',
      cureTime: '24h',
      potLife: '45m',
      rating: 4.9,
      reviewsCount: 164,
      inStock: true,
      isCustomizable: false,
      image: IMAGES.micaChameleon,
      gallery: [
        IMAGES.micaChameleon,
        IMAGES.oceanMicaJar,
        IMAGES.geodeCanvas,
        IMAGES.coasterSet
      ],
      variants: [
        { id: 'mica-12', label: '12 × 10g Apothecary Glass Jars', desc: 'Aurora Teal, Rose Gold, Emerald, Copper & more', price: 899, regularPrice: 1199, unitPrice: '₹75 / jar', popular: true },
        { id: 'mica-24', label: '24 × 10g Master Colorist Vault', desc: 'Full spectrum metallic + interference pearl', price: 1599, regularPrice: 2199, unitPrice: '₹66 / jar' }
      ],
      specs: {
        mixRatioWeight: '1% – 3% pigment load by weight',
        mixRatioVolume: '1 scoop per 100g mixed resin',
        workingPotLife: 'Does not alter resin pot life',
        demoldDuration: 'Standard per resin system',
        fullGlassCure: 'Zero sinking suspension',
        dynamicViscosity: '10–60 μm particle size',
        maxDepth: 'All pour depths',
        hardness: 'Non-reactive mineral',
        uvStability: '100% Lightfast Inorganic'
      }
    },
    {
      id: 'ram-keep-004',
      sku: 'RAM-CST-FLR-04',
      name: 'Petrified Botanical & Brass Edge Coaster Set (Set of 4)',
      shortName: 'Botanical Brass Coasters (4)',
      subtitle: 'Real Pressed Delphiniums & Gold Foil Electroplated Rim in Heat-Resistant Resin',
      category: 'keepsakes',
      subCategory: 'home_decor',
      relatedCategories: ['casting', 'molds'],
      badge: 'Gift Favorite',
      price: 1399,
      regularPrice: 1799,
      unitPriceLabel: '₹349 / coaster',
      ratio: '3:1',
      viscosity: 'medium',
      pourDepth: '12mm',
      cureTime: '24h',
      potLife: '45m',
      rating: 4.9,
      reviewsCount: 276,
      inStock: true,
      isCustomizable: true,
      image: IMAGES.coasterSet,
      gallery: [
        IMAGES.coasterSet,
        IMAGES.geodeMold,
        IMAGES.jewelryBezel,
        IMAGES.floralCube
      ],
      variants: [
        { id: 'cst-rose', label: 'Set of 4 — Blush Rose & 24K Gold Foil', desc: 'Includes brass holder stand', price: 1399, regularPrice: 1799, unitPrice: 'Set of 4', popular: true },
        { id: 'cst-emerald', label: 'Set of 4 — Emerald Agate & White Bloom', desc: 'Alcohol ink petrified bloom technique', price: 1499, regularPrice: 1899, unitPrice: 'Set of 4' }
      ],
      specs: {
        mixRatioWeight: '3 : 1 Heat-Shield Formula',
        mixRatioVolume: '2.6 : 1',
        workingPotLife: '45 Minutes',
        demoldDuration: '18 Hours',
        fullGlassCure: 'Thermal Cured to 85°C',
        dynamicViscosity: '750 mPa·s',
        maxDepth: '12mm Agate Edge',
        hardness: '84D Hot-Cup Safe',
        uvStability: 'HALS 5+ Years'
      }
    },
    {
      id: 'vk-res-003',
      sku: 'VK-HG-11-500',
      name: 'High-Gloss Doming & Topcoat Epoxy 1:1',
      shortName: 'High-Gloss Doming 1:1',
      subtitle: 'High-Viscosity Self-Leveling Glass Coat for Nameplates, Trays & Canvas Art',
      category: 'doming',
      subCategory: 'doming_1_1',
      badge: 'High Viscosity',
      price: 799,
      regularPrice: 899,
      unitPriceLabel: '₹159 / 100g',
      ratio: '1:1',
      viscosity: 'high',
      pourDepth: '10mm',
      cureTime: '12h',
      potLife: '30m',
      rating: 5.0,
      reviewsCount: 64,
      inStock: true,
      isCustomizable: false,
      image: IMAGES.doming11,
      gallery: [
        IMAGES.doming11,
        IMAGES.ultraclearThumb4,
        IMAGES.coasterSet,
        IMAGES.ultraclearThumb1
      ],
      variants: [
        { id: 'dom-500g', label: '500g Surface Kit', desc: '250g Resin + 250g Hardener', price: 799, regularPrice: 899, unitPrice: '₹159 / 100g', popular: true },
        { id: 'dom-2kg', label: '2.0kg Studio Topcoat Pack', desc: '1kg Resin + 1kg Hardener', price: 2499, regularPrice: 2999, unitPrice: '₹125 / 100g' }
      ],
      specs: {
        mixRatioWeight: '1 : 1 (Equal Weight/Vol)',
        mixRatioVolume: '1 : 1',
        workingPotLife: '30 – 35 Minutes',
        demoldDuration: '10 – 12 Hours',
        fullGlassCure: '36 Hours',
        dynamicViscosity: '2400 mPa·s (Honey Dome)',
        maxDepth: '6mm Doming Coat',
        hardness: '83D Scratch Resistant',
        uvStability: 'HALS Surface Armor'
      }
    },
    {
      id: 'vk-mld-geo',
      sku: 'VK-MLD-GEO-04',
      name: 'Platinum Silicone Geode Coaster & Tray Mold Set',
      shortName: 'Silicone Geode Mold (4x)',
      subtitle: 'Tear-Resistant Mirror-Interior Platinum Silicone for 80+ Effortless Demolds',
      category: 'molds',
      subCategory: 'silicone_molds',
      badge: 'Mirror Gloss',
      price: 449,
      regularPrice: 599,
      unitPriceLabel: '4 Cavities',
      ratio: '3:1',
      viscosity: 'low',
      pourDepth: '15mm',
      cureTime: '24h',
      potLife: '45m',
      rating: 4.8,
      reviewsCount: 152,
      inStock: true,
      isCustomizable: false,
      image: IMAGES.geodeMold,
      gallery: [
        IMAGES.geodeMold,
        IMAGES.siliconeMold4x,
        IMAGES.coasterSet,
        IMAGES.ultraclearThumb4
      ],
      variants: [
        { id: 'mld-4cav', label: 'Set of 4 Agate Coaster Cavities', desc: '12mm depth • Natural live geode rim', price: 449, regularPrice: 599, unitPrice: '₹112 / mold', popular: true },
        { id: 'mld-block', label: '8" × 8" × 2.5" Deep Floral Block Mold', desc: 'Reinforced non-bowing walls for varmala blocks', price: 1199, regularPrice: 1499, unitPrice: 'Heavy Duty' }
      ],
      specs: {
        mixRatioWeight: 'Platinum Addition-Cure Silicone',
        mixRatioVolume: 'Shore A 30 Flexibility',
        workingPotLife: '80+ Casts Lifespan',
        demoldDuration: 'No Mold Release Spray Needed',
        fullGlassCure: 'Heat Resistant to 220°C',
        dynamicViscosity: 'Optical Mirror Interior',
        maxDepth: '12mm – 65mm',
        hardness: 'Tear Strength 28 kN/m',
        uvStability: 'Washable with Warm Soap'
      }
    },
    {
      id: 'vk-res-006',
      sku: 'VK-EB-31-1000',
      name: 'EcoBio 3:1 Botanical Bio-Based Casting Resin',
      shortName: 'EcoBio 3:1 Bio Resin',
      subtitle: '42% Plant-Derived Carbon Content • Zero VOC & Ultra-Gentle for Home Studios',
      category: 'bio_based',
      subCategory: 'casting_3_1',
      badge: 'Plant Based',
      price: 1450,
      regularPrice: 1690,
      unitPriceLabel: '₹145 / 100g',
      ratio: '3:1',
      viscosity: 'medium',
      pourDepth: '20mm',
      cureTime: '24h',
      potLife: '45m',
      rating: 4.7,
      reviewsCount: 73,
      inStock: true,
      isCustomizable: false,
      image: IMAGES.ecoBio,
      gallery: [
        IMAGES.ecoBio,
        IMAGES.ultraclearMain,
        IMAGES.ultraclearThumb2,
        IMAGES.floralCube
      ],
      variants: [
        { id: 'eco-1kg', label: '1.0kg Bio-Craft Kit', desc: '750g Bio Resin + 250g Hardener', price: 1450, regularPrice: 1690, unitPrice: '₹145 / 100g', popular: true }
      ],
      specs: {
        mixRatioWeight: '3 : 1 Bio-Epoxy',
        mixRatioVolume: '2.6 : 1',
        workingPotLife: '45 Minutes',
        demoldDuration: '24 Hours',
        fullGlassCure: '72 Hours',
        dynamicViscosity: '700 mPa·s',
        maxDepth: '20mm',
        hardness: '81D',
        uvStability: 'ASTM D6866 Certified Bio'
      }
    },
    {
      id: 'potry-sienna-01',
      sku: 'PTR-SN-1200',
      name: 'Sienna Ridged Stoneware & Resin-Glazed Vessel',
      shortName: 'Sienna Ridged Pitcher',
      subtitle: 'Wheel-Thrown Iron Stoneware Paired with Food-Safe Vitreous Mineral Glaze',
      category: 'ceramics',
      subCategory: 'home_decor',
      badge: 'Atelier Collab',
      price: 2499,
      regularPrice: 2999,
      unitPriceLabel: '1.2L Vessel',
      ratio: '1:1',
      viscosity: 'medium',
      pourDepth: '10mm',
      cureTime: '24h',
      potLife: '45m',
      rating: 4.9,
      reviewsCount: 94,
      inStock: true,
      isCustomizable: true,
      image: IMAGES.siennaPitcher,
      gallery: [
        IMAGES.siennaPitcher,
        IMAGES.siennaSpout,
        IMAGES.siennaTable,
        IMAGES.siennaStamp
      ],
      variants: [
        { id: 'sienna-12l', label: '1.2L Standard Pitcher — Ochre Sand', desc: 'Wheel-thrown • 4–6 servings', price: 2499, regularPrice: 2999, unitPrice: '1,200 ml', popular: true },
        { id: 'sienna-08l', label: '0.8L Compact Carafe — Charcoal Basalt', desc: 'Wheel-thrown • 2–3 servings', price: 1999, regularPrice: 2399, unitPrice: '800 ml' }
      ],
      specs: {
        mixRatioWeight: 'Cone 10 Reduction Stoneware',
        mixRatioVolume: '1,200 ml Capacity',
        workingPotLife: '3-Day Wheel & Rib Process',
        demoldDuration: 'Bisque Fired Cone 06',
        fullGlassCure: '2350°F Kiln Vitrification',
        dynamicViscosity: 'Lead-Free Feldspathic Glaze',
        maxDepth: '21.0 cm Height × 11.4 cm Base',
        hardness: 'Thermal Shock Resistant',
        uvStability: 'Heirloom Permanent'
      }
    }
  ];

  const DEFAULT_SOCIAL_POSTS = [
    {
      id: 'post-001',
      handle: '@resin.art.memories',
      authorName: 'Aanya • Lead Preservation Artist',
      avatar: IMAGES.avatarPatron,
      location: 'Mumbai & Bengaluru Studio',
      timeAgo: '2h ago',
      tag: 'BridalVarmala',
      badge: 'Reel • 148K views',
      image: IMAGES.floralCube,
      caption: 'When she sent us her wedding varmala from Udaipur, the roses were already 4 days old 🌹✨ After 14 days of gentle silica-gel dehydration and 4 crystal-clear pours using our Deep Pour 2:1 formula, her memories are now frozen in glass forever! Drop a 💕 if you want your wedding flowers preserved!',
      likes: 2842,
      saved: true,
      liked: true,
      productId: 'ram-keep-001',
      comments: [
        { user: '@meera.kapoor', text: 'I literally cried opening my varmala block yesterday!! The clarity is unreal 😭💖', time: '1h' },
        { user: '@craft_by_ria', text: 'Which resin system did you use for zero bubbles around the rose petals?', time: '45m' },
        { user: '@resin.art.memories', text: '@craft_by_ria We seal first with UltraClear 3:1 and cast the block with River Flow 2:1 Deep Pour! Both tagged right here ✨', time: '30m' }
      ]
    },
    {
      id: 'post-002',
      handle: '@resin.art.memories',
      authorName: 'Resin Art Memories Studio',
      avatar: IMAGES.avatarPatron,
      location: 'Goa Coastal Collection',
      timeAgo: '6h ago',
      tag: 'OceanArt',
      badge: 'Shoppable Post',
      image: IMAGES.oceanWave,
      caption: 'That lacing cell action though 🌊🤍 Three layers of turquoise, deep navy, and our high-viscosity 1:1 Doming Epoxy blown over seasoned Burma teak. Perfect for cheese platters, vanity trays, or anniversary gifts!',
      likes: 1654,
      saved: false,
      liked: false,
      productId: 'ram-keep-002',
      comments: [
        { user: '@arjun_interiors', text: 'Ordered 3 of these for our coastal villa project in Alibaug. Stunning finish!', time: '4h' }
      ]
    },
    {
      id: 'post-003',
      handle: '@resin.art.memories',
      authorName: 'Vistāra Formulation Lab',
      avatar: IMAGES.avatarPatron,
      location: 'ISO 9001 Lab • Batch #VK-25-C38',
      timeAgo: '1d ago',
      tag: 'ResinFormulas',
      badge: 'Lab Tested 99.4% Clarity',
      image: IMAGES.ultraclearThumb2,
      caption: 'Look at the millimeter grid through a solid 50mm cured disc of our UltraClear 3:1 & Deep Pour systems 🔍 Zero optical distortion, zero micro-bubbles without a vacuum chamber, and fortified with HALS UV stabilizers for Indian summers.',
      likes: 3190,
      saved: true,
      liked: false,
      productId: 'vk-epx-301',
      comments: [
        { user: '@studio_kaveri', text: 'Switched my entire workshop to Vistāra 4kg kits last month. Best pot life in 34°C weather!', time: '18h' }
      ]
    },
    {
      id: 'post-004',
      handle: '@resin.art.memories',
      authorName: 'Aanya • Lead Preservation Artist',
      avatar: IMAGES.avatarPatron,
      location: 'Jaipur Royal Commissions',
      timeAgo: '2d ago',
      tag: 'ClientLove',
      badge: 'Custom Geode Art',
      image: IMAGES.geodeCanvas,
      caption: 'Champagne gold, raw Himalayan quartz crystals, and chameleon bronze mica ✨ Hand-sculpted for a couple’snew living room in South Delhi. Every geode catches morning sunlight like liquid jewelry.',
      likes: 1920,
      saved: false,
      liked: true,
      productId: 'ram-keep-003',
      comments: [
        { user: '@nisha_designs', text: 'Can we customize the colors to emerald and antique brass?', time: '1d' },
        { user: '@resin.art.memories', text: '@nisha_designs Yes! Use our Custom Memory Studio tab to pick your exact palette 🎨', time: '1d' }
      ]
    },
    {
      id: 'post-005',
      handle: '@resin.art.memories',
      authorName: 'Botanical Jewelry Bar',
      avatar: IMAGES.avatarPatron,
      location: 'Bengaluru Atelier',
      timeAgo: '3d ago',
      tag: 'BridalVarmala',
      badge: '90-Sec UV Cure',
      image: IMAGES.jewelryBezel,
      caption: 'Turned leftover petals from a bride’s bouquet into 6 matching gold bezel pendants for her bridesmaids 💐💫 Cured in 90 seconds flat with our Optical UV Hard Resin!',
      likes: 4105,
      saved: false,
      liked: false,
      productId: 'vk-uv-hard',
      comments: [
        { user: '@shruti_weds_rohan', text: 'Such a thoughtful bridesmaid gift idea!! Booking mine now!', time: '2d' }
      ]
    },
    {
      id: 'post-006',
      handle: '@resin.art.memories',
      authorName: 'Resin Art Memories Studio',
      avatar: IMAGES.avatarPatron,
      location: 'Hyderabad Studio',
      timeAgo: '4d ago',
      tag: 'ClientLove',
      badge: 'Bestselling Gift',
      image: IMAGES.coasterSet,
      caption: 'Petrified alcohol-ink blooms + real pressed florals edged in antique brass ✨ Set of 4 coasters that turn every coffee date into a little flirtation with art ☕💛',
      likes: 2280,
      saved: false,
      liked: false,
      productId: 'ram-keep-004',
      comments: [
        { user: '@tanvi.m', text: 'Got these for my best friend’s housewarming and she’s obsessed!', time: '3d' }
      ]
    }
  ];

  const DEFAULT_STORIES = [
    {
      id: 'story-varmala',
      title: 'Varmala ✨',
      subtitle: 'Bridal Preservation Process',
      image: IMAGES.floralCube,
      productId: 'ram-keep-001',
      caption: 'Step inside our 14-day silica floral preservation ritual — from doorstep pickup across India to museum-grade 50mm crystal encapsulation.',
      ctaText: 'Book Varmala Block • ₹4,499'
    },
    {
      id: 'story-ocean',
      title: 'Ocean Pour 🌊',
      subtitle: 'Lacing Wave Technique',
      image: IMAGES.oceanWave,
      productId: 'ram-keep-002',
      caption: 'Watch how our 2400 mPa·s Doming Epoxy creates authentic foaming white-water cells over Burma teak.',
      ctaText: 'Shop Ocean Tray • ₹2,199'
    },
    {
      id: 'story-ultraclear',
      title: '3:1 Secret 🧪',
      subtitle: 'Zero Bubble Guarantee',
      image: IMAGES.ultraclearMain,
      productId: 'vk-epx-301',
      caption: 'Why 3,400+ Indian resin artists switched to Vistāra UltraClear 3:1 — self-degassing formula calibrated for 25°C–35°C.',
      ctaText: 'Shop 1.2kg Kit • ₹1,299'
    },
    {
      id: 'story-geode',
      title: 'Geode Luxe 💎',
      subtitle: '24K Gold & Raw Quartz',
      image: IMAGES.geodeCanvas,
      productId: 'ram-keep-003',
      caption: 'Hand-placed natural quartz clusters with our Chameleon Mica pigments.',
      ctaText: 'Shop Geode Art • ₹3,899'
    },
    {
      id: 'story-jewelry',
      title: 'Petal Gems 🌹',
      subtitle: '90s UV Resin Charms',
      image: IMAGES.jewelryBezel,
      productId: 'vk-uv-hard',
      caption: 'Make crystal-clear botanical pendants in 90 seconds under 365nm UV light.',
      ctaText: 'Get UV Resin • ₹649'
    },
    {
      id: 'story-ceramics',
      title: 'Potry × RAM 🏺',
      subtitle: 'Stoneware & Glaze',
      image: IMAGES.siennaPitcher,
      productId: 'potry-sienna-01',
      caption: 'Limited collaboration: Wheel-thrown Red Hook stoneware vessels with mineral ash glazes.',
      ctaText: 'Shop Sienna Pitcher • ₹2,499'
    }
  ];

  const COUPONS = {
    KRAFTFIRST: { code: 'KRAFTFIRST', type: 'flat', value: 150, minOrder: 500, desc: '₹150.00 saved on your studio order!' },
    MEMORIES10: { code: 'MEMORIES10', type: 'percent', value: 10, minOrder: 1000, desc: '10% Instagram Community Discount applied!' },
    FLIRTY15: { code: 'FLIRTY15', type: 'percent', value: 15, minOrder: 2500, desc: '15% VIP Keepsake & Studio Discount applied!' },
    STUDIO20: { code: 'STUDIO20', type: 'percent', value: 20, minOrder: 5000, desc: '20% Wholesale Pro Studio Discount applied!' }
  };

  const PINCODE_DIRECTORY = {
    '560001': { city: 'Bengaluru Urban, KA', days: '2 business days', courier: 'BlueDart Priority Air', floralPickup: true },
    '400001': { city: 'Mumbai South, MH', days: '1–2 business days', courier: 'BlueDart Express & Studio Runner', floralPickup: true },
    '110001': { city: 'New Delhi Central, DL', days: '2 business days', courier: 'Delhivery Air Cargo', floralPickup: true },
    '500001': { city: 'Hyderabad, TS', days: '2 business days', courier: 'BlueDart Air', floralPickup: true },
    '600001': { city: 'Chennai, TN', days: '2–3 business days', courier: 'Delhivery Surface/Air', floralPickup: true },
    '411001': { city: 'Pune, MH', days: '2 business days', courier: 'BlueDart Express', floralPickup: true },
    '302001': { city: 'Jaipur, RJ', days: '2–3 business days', courier: 'Delhivery Express', floralPickup: true },
    '700001': { city: 'Kolkata, WB', days: '3 business days', courier: 'BlueDart Air Cargo', floralPickup: true }
  };

  const memoryStorage = new Map();

  function cloneFallback(val) {
    if (val && typeof val === 'object') {
      try { return JSON.parse(JSON.stringify(val)); } catch (e) { return val; }
    }
    return val;
  }

  function safeRead(key, fallback) {
    if (memoryStorage.has(key)) {
      try { return JSON.parse(memoryStorage.get(key)); } catch (e) { /* fall through */ }
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : cloneFallback(fallback);
    } catch (e) {
      if (memoryStorage.has(key)) {
        try { return JSON.parse(memoryStorage.get(key)); } catch (err) { /* ignore */ }
      }
      return cloneFallback(fallback);
    }
  }

  function safeWrite(key, val) {
    const serialized = JSON.stringify(val);
    try {
      localStorage.setItem(key, serialized);
      memoryStorage.delete(key);
    } catch (e) {
      // Fallback to in-memory session storage when localStorage throws SecurityError or QuotaExceededError
      memoryStorage.set(key, serialized);
    }
  }

  // Initialize default cart matching the Stitch cart screen if not yet initialized
  const DEFAULT_CART = [
    {
      cartItemId: 'item_resin_uc31_1200g',
      productId: 'vk-epx-301',
      sku: 'VK-RES-UC31-12KG',
      name: 'UltraClear 3:1 Casting Resin',
      variantLabel: '1.2kg Kit • Industrial Grade',
      price: 1299,
      regularPrice: 1550,
      qty: 1,
      image: IMAGES.ultraclearMain,
      ratio: '3:1 by weight',
      viscosity: '600 mPa·s',
      hsn: '39073010',
      customNote: ''
    },
    {
      cartItemId: 'item_mold_geode_4cav',
      productId: 'vk-mld-geo',
      sku: 'VK-MLD-GEO-04',
      name: 'Silicone Geode Coaster Mold',
      variantLabel: 'Set of 4 Organic Cavities',
      price: 449,
      regularPrice: 599,
      qty: 1,
      image: IMAGES.geodeMold,
      ratio: 'Platinum cure',
      viscosity: 'Mirror interior gloss',
      hsn: '39269099',
      customNote: ''
    }
  ];

  const DEFAULT_ORDERS = [
    {
      orderId: 'RAM-2025-8841',
      date: '10 Oct 2026',
      total: 4499,
      subtotal: 4499,
      discount: 0,
      gstAmount: 686.29,
      paymentMethod: 'UPI Instant (GPay / PhonePe / Paytm)',
      customerName: 'Vistāra Studio Sample Order',
      phone: 'Verified at Checkout',
      address: 'Shipping address assigned upon Patron Sign-In',
      giftWrap: true,
      mockupApproved: false,
      status: 'Deep Cast Pour (Stage 4 of 5)',
      stageIndex: 3,
      stages: ['Order Confirmed', 'Flowers Received at Studio', 'Silica Dehydration (7d)', 'Deep Optical Cast Pour', 'Diamond Polish & Dispatch'],
      items: [{ productId: 'ram-keep-001', name: 'Eternal Varmala & Bridal Bouquet Time-Capsule Block (12")', qty: 1, price: 4499 }],
      courier: 'BlueDart Air Priority • AWB #BD99412048'
    }
  ];

  // Backend & External Admin Host Configuration
  const backendConfig = {
    supabase: {
      url: global.SUPABASE_URL || 'https://your-project.supabase.co',
      anonKey: global.SUPABASE_ANON_KEY || 'sb_publishable_ready_to_connect',
      status: global.SUPABASE_URL ? 'connected' : 'staged_local_replica',
      tables: ['products', 'product_variants', 'social_posts', 'orders', 'custom_commissions', 'reviews']
    },
    cloudflare: {
      apiBaseUrl: (global.VistaraCloudflareConfig && global.VistaraCloudflareConfig.apiBaseUrl) || '/api',
      r2BucketUrl: global.CLOUDFLARE_R2_URL || 'https://media.vistarakrafts.com',
      accountId: 'cf_d1_kv_r2_vistara_krafts',
      status: 'cloudflare_edge_ready'
    },
    adminHostBridge: {
      channelName: 'resin_art_memories_admin_push',
      allowedOrigins: ['*'],
      lastSync: new Date().toISOString(),
      status: 'listening_realtime'
    }
  };

  let edgeSessionToken = '';

  function hashSecretLocal(str) {
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 'vk_h_' + (h >>> 0).toString(16);
  }

  function callCloudflareEdge(path, method = 'GET', body = null) {
    try {
      if (typeof global.fetch !== 'function') return Promise.resolve(null);
      const base = ((global.VistaraCloudflareConfig && global.VistaraCloudflareConfig.apiBaseUrl) || '/api').replace(/\/$/, '');
      const headers = { 'Content-Type': 'application/json' };
      if (edgeSessionToken) {
        headers['Authorization'] = 'Bearer ' + edgeSessionToken;
      }
      return global.fetch(base + path, {
        method,
        headers,
        credentials: 'same-origin',
        body: body ? JSON.stringify(body) : undefined
      }).then(res => res.json().catch(() => null)).catch(() => null);
    } catch (_e) {
      return Promise.resolve(null);
    }
  }

  const listeners = new Set();

  const Store = {
    IMAGES,
    COUPONS,
    DEFAULT_STORIES,
    backendConfig,

    formatINR(num) {
      const val = Math.round(Number(num) || 0);
      return '₹' + val.toLocaleString('en-IN');
    },

    resetMemoryFallback() {
      memoryStorage.clear();
    },

    getEffectiveUnitPrice(priceOrItem, qtyArg) {
      const basePrice = typeof priceOrItem === 'object' && priceOrItem !== null
        ? Number(priceOrItem.price || 0)
        : Number(priceOrItem || 0);
      const qty = typeof priceOrItem === 'object' && priceOrItem !== null && qtyArg === undefined
        ? Number(priceOrItem.qty || 1)
        : Number(qtyArg !== undefined ? qtyArg : 1);
      if (qty >= 6) {
        return basePrice === 1299 ? 1089 : Math.round(basePrice * 0.84);
      }
      if (qty >= 3) {
        return basePrice === 1299 ? 1199 : Math.round(basePrice * 0.92);
      }
      return basePrice;
    },

    getProducts() {
      const saved = safeRead(STORAGE_KEYS.PRODUCTS, null);
      if (saved && Array.isArray(saved) && saved.length >= DEFAULT_PRODUCTS.length) {
        return saved;
      }
      const initial = cloneFallback(DEFAULT_PRODUCTS);
      safeWrite(STORAGE_KEYS.PRODUCTS, initial);
      return initial;
    },

    getProductById(id) {
      const aliasMap = { 'potry-sienna-pitcher': 'potry-sienna-01', 'vk-dom-101': 'vk-res-003' };
      const resolvedId = aliasMap[id] || id;
      const list = this.getProducts();
      return list.find(p => p.id === resolvedId) || list[0];
    },

    getSocialPosts() {
      const saved = safeRead(STORAGE_KEYS.SOCIAL_POSTS, null);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
      const initial = cloneFallback(DEFAULT_SOCIAL_POSTS);
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, initial);
      return initial;
    },

    toggleLikePost(postId) {
      const posts = this.getSocialPosts().map(p => {
        if (p.id === postId) {
          const liked = !p.liked;
          return { ...p, liked, likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1) };
        }
        return p;
      });
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, posts);
      this.notify('social_updated', { postId });
      return posts.find(p => p.id === postId);
    },

    toggleSavePost(postId) {
      const posts = this.getSocialPosts().map(p => {
        if (p.id === postId) {
          return { ...p, saved: !p.saved };
        }
        return p;
      });
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, posts);
      this.notify('social_updated', { postId });
      return posts.find(p => p.id === postId);
    },

    addComment(postId, userHandle, text) {
      const cleanText = String(text || '').trim();
      if (!cleanText) return null;
      const handle = String(userHandle || '@patron_guest').trim();
      const posts = this.getSocialPosts().map(p => {
        if (p.id === postId) {
          const comments = [...(p.comments || []), {
            user: handle.startsWith('@') ? handle : '@' + handle,
            text: cleanText,
            time: 'Just now'
          }];
          return { ...p, comments };
        }
        return p;
      });
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, posts);
      this.notify('social_updated', { postId });
      return posts.find(p => p.id === postId);
    },

    addCustomerPost({ authorName, handle, caption, tag, image, productId }) {
      const posts = this.getSocialPosts();
      const newPost = {
        id: 'post-' + Date.now(),
        handle: handle ? (handle.startsWith('@') ? handle : '@' + handle) : '@resin.patron',
        authorName: authorName || 'Verified Studio Patron',
        avatar: IMAGES.avatarPatron,
        location: 'Community Showcase • India',
        timeAgo: 'Just now',
        tag: tag || 'ClientLove',
        badge: 'Community Memory',
        image: image || IMAGES.floralCube,
        caption: caption || 'Preserved our special memories forever with @resin.art.memories!',
        likes: 1,
        saved: false,
        liked: true,
        productId: productId || 'ram-keep-001',
        comments: []
      };
      const updated = [newPost, ...posts];
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, updated);
      this.notify('social_updated', { postId: newPost.id });
      return newPost;
    },

    getCart() {
      const saved = safeRead(STORAGE_KEYS.CART, null);
      if (saved && Array.isArray(saved)) return saved;
      const initial = cloneFallback(DEFAULT_CART);
      safeWrite(STORAGE_KEYS.CART, initial);
      return initial;
    },

    saveCart(cart) {
      safeWrite(STORAGE_KEYS.CART, cart);
      this.notify('cart_updated', this.getCartSummary());
    },

    addToCart(arg1, variantIdOrLabel, qtyArg) {
      let opts = {};
      if (typeof arg1 === 'string') {
        const prod = this.getProductById(arg1);
        const matchedVar = prod && prod.variants
          ? prod.variants.find(v => v.id === variantIdOrLabel || v.label === variantIdOrLabel) || prod.variants[0]
          : null;
        opts = {
          productId: arg1,
          variantLabel: matchedVar ? matchedVar.label : (variantIdOrLabel || 'Standard Edition'),
          price: matchedVar ? matchedVar.price : (prod ? prod.price : 1299),
          regularPrice: matchedVar ? matchedVar.regularPrice : (prod ? prod.regularPrice : 1499),
          qty: qtyArg || 1
        };
      } else {
        opts = arg1 || {};
      }

      const { productId, variantLabel, price, regularPrice, qty = 1, customNote = '', name, image, sku } = opts;
      const product = this.getProductById(productId);
      const cart = this.getCart();
      const targetName = name || (product ? product.name : 'Studio Formulation');
      const targetVariant = variantLabel || (product && product.variants && product.variants[0] ? product.variants[0].label : 'Standard Edition');
      const unitPrice = Number(price || (product ? product.price : 1299));
      const regPrice = Number(regularPrice || (product ? product.regularPrice : unitPrice));
      const itemKey = `${productId || targetName}__${targetVariant}__${customNote || ''}`;

      const existingIndex = cart.findIndex(item =>
        (item.itemKey && item.itemKey === itemKey) ||
        (item.productId === productId && item.variantLabel === targetVariant && (item.customNote || '') === (customNote || ''))
      );

      if (existingIndex > -1) {
        cart[existingIndex].qty = Math.min(99, cart[existingIndex].qty + Number(qty || 1));
      } else {
        cart.push({
          cartItemId: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          itemKey,
          productId: productId || 'vk-epx-301',
          sku: sku || (product ? product.sku : 'VK-STD-01'),
          name: targetName,
          variantLabel: targetVariant,
          price: unitPrice,
          regularPrice: regPrice,
          qty: Math.max(1, Number(qty || 1)),
          image: image || (product ? product.image : IMAGES.ultraclearMain),
          ratio: product ? `Ratio: ${product.ratio}` : 'Studio Grade',
          viscosity: product && product.specs ? product.specs.dynamicViscosity : 'Lab Certified',
          hsn: '39073010',
          customNote: customNote || ''
        });
      }
      this.saveCart(cart);
      return this.getCartSummary();
    },

    updateCartQty(cartItemId, deltaOrExact, isExact = false) {
      let cart = this.getCart();
      cart = cart.map(item => {
        if (item.cartItemId === cartItemId || item.productId === cartItemId) {
          const nextQty = isExact ? Number(deltaOrExact) : item.qty + Number(deltaOrExact);
          return { ...item, qty: nextQty };
        }
        return item;
      }).filter(item => item.qty > 0);
      this.saveCart(cart);
      return this.getCartSummary();
    },

    removeFromCart(cartItemId) {
      const cart = this.getCart().filter(item => item.cartItemId !== cartItemId && item.productId !== cartItemId);
      this.saveCart(cart);
      return this.getCartSummary();
    },

    clearCart() {
      this.saveCart([]);
    },

    getCouponCode() {
      return safeRead(STORAGE_KEYS.COUPON, 'KRAFTFIRST');
    },

    applyCoupon(code) {
      const normalized = String(code || '').trim().toUpperCase();
      if (!normalized) {
        safeWrite(STORAGE_KEYS.COUPON, '');
        this.notify('cart_updated', this.getCartSummary());
        return { valid: false, ok: false, message: 'Coupon removed.' };
      }
      const coupon = COUPONS[normalized];
      if (!coupon) {
        return { valid: false, ok: false, message: `Invalid voucher code "${normalized}". Try KRAFTFIRST, MEMORIES10, or FLIRTY15.` };
      }
      const subtotal = this.getCart().reduce((sum, i) => sum + (this.getEffectiveUnitPrice(i) * i.qty), 0);
      if (subtotal < coupon.minOrder) {
        return { valid: false, ok: false, message: `Code ${normalized} requires a minimum bag of ₹${coupon.minOrder.toLocaleString('en-IN')}.` };
      }
      safeWrite(STORAGE_KEYS.COUPON, normalized);
      this.notify('cart_updated', this.getCartSummary());
      return { valid: true, ok: true, coupon, message: coupon.desc };
    },

    getCartSummary() {
      const cart = this.getCart();
      const itemsCount = cart.reduce((acc, item) => acc + Number(item.qty || 0), 0);
      const subtotal = cart.reduce((acc, item) => {
        const effectiveUnitPrice = this.getEffectiveUnitPrice(item);
        return acc + effectiveUnitPrice * item.qty;
      }, 0);
      const regularTotal = cart.reduce((acc, item) => acc + Number(item.regularPrice || item.price) * item.qty, 0);

      const activeCode = this.getCouponCode();
      const couponObj = activeCode ? COUPONS[activeCode] : null;
      let couponDiscount = 0;
      let couponMinOrderShortfall = 0;
      let couponInvalidReason = '';
      if (couponObj && subtotal > 0) {
        if (subtotal >= couponObj.minOrder) {
          if (couponObj.type === 'flat') {
            couponDiscount = Math.min(subtotal, couponObj.value);
          } else if (couponObj.type === 'percent') {
            couponDiscount = Math.round((subtotal * couponObj.value) / 100);
          }
        } else {
          couponMinOrderShortfall = couponObj.minOrder - subtotal;
          couponInvalidReason = `Coupon ${activeCode} requires a ₹${couponObj.minOrder.toLocaleString('en-IN')} minimum bag (add ₹${couponMinOrderShortfall.toLocaleString('en-IN')} more to activate).`;
        }
      }

      const freeShippingThreshold = 1499;
      const isFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
      const shippingFee = isFreeShipping ? 0 : 99;
      const payable = Math.max(0, subtotal - couponDiscount + shippingFee);
      const taxableAmount = Number((payable / 1.18).toFixed(2));
      const gstAmount = Number((payable - taxableAmount).toFixed(2));
      const shippingProgress = subtotal <= 0 ? 0 : Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
      const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

      return {
        cart,
        itemsCount,
        subtotal,
        regularTotal,
        couponCode: couponDiscount > 0 ? activeCode : '',
        savedCouponCode: activeCode || '',
        couponObj: couponDiscount > 0 ? couponObj : null,
        couponDiscount,
        couponMinOrderShortfall,
        couponInvalidReason,
        freeShippingThreshold,
        isFreeShipping,
        shippingFee,
        shippingProgress,
        amountToFreeShipping,
        taxableAmount,
        gstAmount,
        payable
      };
    },

    calculateResinNeeded({ shape = 'rect', lengthCm = 20, widthCm = 20, diameterCm = 20, depthCm = 1.5, ratioSystem = '3:1' } = {}) {
      const d = Number(depthCm);
      let volumeCm3 = 0;
      if (shape === 'circle') {
        const diam = Number(diameterCm);
        if (!(diam > 0 && d > 0)) return { valid: false, totalGrams: 0, partAGrams: 0, partBGrams: 0 };
        const r = diam / 2;
        volumeCm3 = Math.PI * r * r * d;
      } else {
        const l = Number(lengthCm);
        const w = Number(widthCm);
        if (!(l > 0 && w > 0 && d > 0)) return { valid: false, totalGrams: 0, partAGrams: 0, partBGrams: 0 };
        volumeCm3 = l * w * d;
      }
      const totalGrams = Math.round(volumeCm3 * 1.1);
      let partAGrams = 0;
      if (ratioSystem === '3:1') partAGrams = Math.round(totalGrams * 0.75);
      else if (ratioSystem === '2:1') partAGrams = Math.round((totalGrams * 2) / 3);
      else partAGrams = Math.round(totalGrams * 0.5);
      const partBGrams = totalGrams - partAGrams;
      return { valid: true, totalGrams, partAGrams, partBGrams, ratioSystem, shape };
    },

    getWishlist() {
      return safeRead(STORAGE_KEYS.WISHLIST, ['ram-keep-001', 'vk-epx-301', 'ram-keep-004']);
    },

    isWishlisted(productId) {
      return this.getWishlist().includes(productId);
    },

    toggleWishlist(productId) {
      const current = this.getWishlist();
      const exists = current.includes(productId);
      const updated = exists ? current.filter(id => id !== productId) : [...current, productId];
      safeWrite(STORAGE_KEYS.WISHLIST, updated);
      this.notify('wishlist_updated', { productId, added: !exists, count: updated.length });
      return { added: !exists, count: updated.length, wishlist: updated };
    },

    getPincodeInfo() {
      return safeRead(STORAGE_KEYS.PINCODE, {
        pin: '560001',
        city: 'Bengaluru Urban, KA',
        days: '2 business days',
        courier: 'BlueDart Priority Air',
        floralPickup: true
      });
    },

    verifyPincode(pinInput) {
      const pin = String(pinInput || '').trim();
      if (!/^[1-9][0-9]{5}$/.test(pin)) {
        return { valid: false, message: 'Please enter a valid 6-digit Indian PIN code (e.g. 560001, 400001, 110001).' };
      }
      const match = PINCODE_DIRECTORY[pin] || {
        city: `Zone PIN ${pin} (Pan-India Hub)`,
        days: '2–4 business days',
        courier: 'BlueDart / Delhivery Express',
        floralPickup: ['1', '2', '3', '4', '5', '6', '7', '8'].includes(pin[0])
      };
      const record = { pin, ...match, etaDays: match.days };
      safeWrite(STORAGE_KEYS.PINCODE, record);
      this.notify('pincode_updated', record);
      return {
        valid: true,
        ...record,
        message: `${pin} (${record.city}) — Delivery in ${record.days} via ${record.courier}. COD, UPI & 24h Floral Pickup supported.`
      };
    },

    getGstInfo() {
      return safeRead(STORAGE_KEYS.GST_INFO, {
        enabled: true,
        gstin: '29AAFCA1234F1ZX',
        tradeName: 'Aura Craft & Design Studios LLP'
      });
    },

    saveGstInfo(info) {
      const next = { ...this.getGstInfo(), ...info };
      safeWrite(STORAGE_KEYS.GST_INFO, next);
      this.notify('gst_updated', next);
      return next;
    },

    getAuthSession() {
      const session = safeRead(STORAGE_KEYS.AUTH_SESSION, null);
      if (session && typeof session === 'object' && session.authenticated && session.email && session.address) {
        return session;
      }
      return null;
    },

    isAuthenticated() {
      return Boolean(this.getAuthSession());
    },

    lookupSavedPatronByEmail(emailInput) {
      const email = String(emailInput || '').trim().toLowerCase();
      if (!email) return null;
      const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
      return registeredUsers[email] || null;
    },

    loginPatron(payload = {}) {
      const provider = ['google', 'apple', 'email'].includes(payload.provider) ? payload.provider : 'email';
      const email = String(payload.email || '').trim().toLowerCase();
      const password = String(payload.password || '');
      let name = String(payload.name || '').trim();
      let phone = String(payload.phone || '').trim();
      let address = String(payload.address || payload.defaultAddress || '').trim();
      const pincode = String(payload.pincode || '').trim();
      const credential = payload.credential ? String(payload.credential) : '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const msg = 'Please enter a valid email address.';
        return { ok: false, valid: false, error: msg, message: msg };
      }

      const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
      const existingUser = registeredUsers[email] || null;

      if (provider === 'email') {
        if (!password || password.length < 6) {
          const msg = 'Password must be at least 6 characters.';
          return { ok: false, valid: false, error: msg, message: msg };
        }
        const candidateVerifier = hashSecretLocal(password);
        if (existingUser && existingUser.passwordVerifier && existingUser.passwordVerifier !== candidateVerifier) {
          const msg = 'Incorrect password for this email account.';
          return { ok: false, valid: false, error: msg, message: msg };
        }
        if (existingUser && existingUser.password && existingUser.password !== password) {
          const msg = 'Incorrect password for this email account.';
          return { ok: false, valid: false, error: msg, message: msg };
        }
      }

      // Use previously saved user details only if this exact user already registered them earlier
      if (!name && existingUser && existingUser.name) name = existingUser.name;
      if (!phone && existingUser && existingUser.phone) phone = existingUser.phone;
      if (!address && existingUser && existingUser.address) address = existingUser.address;

      if (!name) {
        const msg = 'Please enter your full recipient name.';
        return { ok: false, valid: false, requiresAddress: true, error: msg, message: msg };
      }
      if (!phone) {
        const msg = 'Please provide your Mobile / WhatsApp number for order dispatch.';
        return { ok: false, valid: false, requiresAddress: true, error: msg, message: msg };
      }
      if (!address) {
        const msg = 'Please provide your complete shipping address & PIN code.';
        return { ok: false, valid: false, requiresAddress: true, error: msg, message: msg };
      }

      const pinMatch = address.match(/\b([1-9][0-9]{5})\b/);
      const resolvedPin = pincode || (pinMatch ? pinMatch[1] : '');
      if (resolvedPin && /^[1-9][0-9]{5}$/.test(resolvedPin)) {
        this.verifyPincode(resolvedPin);
      }
      const fullAddress = (pincode && !address.includes(pincode)) ? `${address} - ${pincode}` : address;

      edgeSessionToken = 'vk_cf_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      const userRecord = {
        id: (existingUser && existingUser.id) || ('usr_' + Date.now().toString(36)),
        email,
        name,
        phone,
        address: fullAddress,
        defaultAddress: fullAddress,
        pincode: resolvedPin,
        provider,
        passwordVerifier: provider === 'email'
          ? hashSecretLocal(password)
          : (existingUser ? existingUser.passwordVerifier : ''),
        memberTier: 'Gold Atelier Member',
        tier: 'Gold Atelier Member',
        loyaltyPoints: (existingUser && existingUser.loyaltyPoints) || 250,
        authenticated: true,
        authenticatedAt: new Date().toISOString()
      };

      registeredUsers[email] = userRecord;
      safeWrite(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
      safeWrite(STORAGE_KEYS.AUTH_SESSION, userRecord);
      safeWrite(STORAGE_KEYS.PATRON_PROFILE, userRecord);

      // Sync with Cloudflare Pages Function / Worker (D1 + KV + HttpOnly cookie)
      const endpoint = provider === 'email'
        ? (existingUser ? '/auth/login' : '/auth/register')
        : '/auth/oauth';
      callCloudflareEdge(endpoint, 'POST', {
        provider,
        email,
        password,
        name,
        phone,
        address: fullAddress,
        pincode: resolvedPin,
        credential
      }).then(data => {
        if (data && data.ok && data.token) {
          edgeSessionToken = data.token;
        }
      });

      this.notify('auth_updated', userRecord);
      this.notify('patron_profile_updated', userRecord);
      return { ok: true, valid: true, user: userRecord, session: userRecord, token: edgeSessionToken };
    },

    logoutPatron() {
      // Per sign-in-with-google-web skill: disable automatic One Tap re-selection on sign-out
      try {
        if (global.google && global.google.accounts && global.google.accounts.id && typeof global.google.accounts.id.disableAutoSelect === 'function') {
          global.google.accounts.id.disableAutoSelect();
        }
      } catch (_e) { /* ignore */ }

      safeWrite(STORAGE_KEYS.AUTH_SESSION, null);
      callCloudflareEdge('/auth/logout', 'POST');
      edgeSessionToken = '';

      this.notify('auth_updated', null);
      return { ok: true };
    },

    getPatronProfile() {
      const authSession = this.getAuthSession();
      if (authSession) {
        return {
          ...authSession,
          address: authSession.address,
          defaultAddress: authSession.address,
          tier: authSession.memberTier || 'Verified Vistāra Patron',
          memberTier: authSession.memberTier || 'Verified Vistāra Patron'
        };
      }
      const profile = safeRead(STORAGE_KEYS.PATRON_PROFILE, {
        name: 'Vistāra Studio Guest',
        email: '',
        phone: '',
        address: 'Bengaluru Studio Hub 560001',
        defaultAddress: 'Bengaluru Studio Hub 560001',
        eventDate: '2026-11-18',
        tier: 'Gold Atelier Member',
        memberTier: 'Gold Atelier Member',
        loyaltyPoints: 250
      });
      const resolvedAddress = profile.defaultAddress || profile.address || 'Bengaluru Studio Hub 560001';
      const resolvedTier = profile.memberTier || profile.tier || 'Gold Atelier Member';
      return {
        ...profile,
        address: resolvedAddress,
        defaultAddress: resolvedAddress,
        tier: resolvedTier,
        memberTier: resolvedTier
      };
    },

    savePatronProfile(updates = {}) {
      const current = this.getPatronProfile();
      const next = { ...current, ...updates };
      const resolvedAddress = updates.defaultAddress || updates.address || next.defaultAddress || next.address || 'Bengaluru Studio Hub 560001';
      const resolvedTier = updates.memberTier || updates.tier || next.memberTier || next.tier || 'Gold Atelier Member';
      next.address = resolvedAddress;
      next.defaultAddress = resolvedAddress;
      next.tier = resolvedTier;
      next.memberTier = resolvedTier;
      safeWrite(STORAGE_KEYS.PATRON_PROFILE, next);

      // If explicit patron identity & address were saved, synchronize authenticated session state & D1
      if (updates.name && (updates.defaultAddress || updates.address)) {
        const sessionObj = {
          ...(this.getAuthSession() || {}),
          ...next,
          email: next.email || 'patron@vistarakrafts.in',
          address: resolvedAddress,
          defaultAddress: resolvedAddress,
          provider: next.provider || 'email',
          authenticated: true
        };
        safeWrite(STORAGE_KEYS.AUTH_SESSION, sessionObj);
        if (sessionObj.email) {
          const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
          registeredUsers[sessionObj.email.toLowerCase()] = {
            ...(registeredUsers[sessionObj.email.toLowerCase()] || {}),
            ...sessionObj
          };
          safeWrite(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
        }
        callCloudflareEdge('/auth/profile', 'PUT', {
          name: sessionObj.name,
          phone: sessionObj.phone || '',
          address: resolvedAddress,
          pincode: sessionObj.pincode || ''
        });
        this.notify('auth_updated', sessionObj);
      }

      this.notify('patron_profile_updated', next);
      return next;
    },

    recordRecentlyViewed(productId) {
      if (!productId) return [];
      const prod = this.getProductById(productId);
      const resolvedId = prod ? prod.id : productId;
      const current = safeRead(STORAGE_KEYS.RECENTLY_VIEWED, ['ram-keep-001', 'vk-epx-301', 'ram-keep-002', 'vk-epx-201']);
      const list = Array.isArray(current) ? current.filter(id => id !== resolvedId) : [];
      list.unshift(resolvedId);
      const trimmed = list.slice(0, 6);
      safeWrite(STORAGE_KEYS.RECENTLY_VIEWED, trimmed);
      return trimmed;
    },

    getRecentlyViewedProducts(excludeId = null, limit = 4) {
      const ids = safeRead(STORAGE_KEYS.RECENTLY_VIEWED, ['ram-keep-001', 'vk-epx-301', 'ram-keep-002', 'vk-epx-201']);
      const all = this.getProducts();
      const matched = [];
      (Array.isArray(ids) ? ids : []).forEach(id => {
        if (excludeId && id === excludeId) return;
        const p = all.find(item => item.id === id);
        if (p && !matched.some(m => m.id === p.id)) matched.push(p);
      });
      if (matched.length < limit) {
        all.forEach(p => {
          if (matched.length < limit && p.id !== excludeId && !matched.some(m => m.id === p.id)) {
            matched.push(p);
          }
        });
      }
      return matched.slice(0, limit);
    },

    getOrders() {
      const list = safeRead(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
      const auth = this.getAuthSession();
      if (!auth) return list;
      return list.map(o => {
        if (o.customerName === 'Vistāra Studio Sample Order') {
          return {
            ...o,
            customerName: auth.name || o.customerName,
            phone: auth.phone || o.phone,
            address: auth.address || o.address
          };
        }
        return o;
      });
    },

    findOrder(query) {
      const orders = this.getOrders();
      const q = String(query || '').trim().toLowerCase();
      if (!q) return orders;
      return orders.filter(o =>
        String(o.orderId || '').toLowerCase().includes(q) ||
        String(o.status || '').toLowerCase().includes(q) ||
        String(o.courier || '').toLowerCase().includes(q) ||
        String(o.phone || '').toLowerCase().includes(q) ||
        String(o.customerName || '').toLowerCase().includes(q) ||
        (Array.isArray(o.items) && o.items.some(it => String(it.name || '').toLowerCase().includes(q)))
      );
    },

    approveOrderMockup(orderId) {
      const orders = this.getOrders().map(o => {
        if (o.orderId === orderId) {
          const nextStage = Math.min((o.stages ? o.stages.length - 1 : 4), Math.max(o.stageIndex || 1, 3));
          return {
            ...o,
            mockupApproved: true,
            stageIndex: nextStage,
            status: 'Floral Layout Approved • Deep Cast Pour in Progress'
          };
        }
        return o;
      });
      safeWrite(STORAGE_KEYS.ORDERS, orders);
      const updated = orders.find(o => o.orderId === orderId) || null;
      if (updated) {
        callCloudflareEdge('/orders', 'POST', updated);
      }
      this.notify('order_updated', updated);
      return updated;
    },

    placeOrder(checkoutDetails = {}) {
      const summary = this.getCartSummary();
      if (summary.itemsCount === 0) {
        return { success: false, message: 'Your Studio Bag is empty.' };
      }
      const authSession = this.getAuthSession();
      const customerName = String(checkoutDetails.name || (authSession && authSession.name) || '').trim();
      const customerPhone = String(checkoutDetails.phone || (authSession && authSession.phone) || '').trim();
      const customerAddress = String(checkoutDetails.address || (authSession && authSession.address) || '').trim();

      if (!authSession || !customerName || !customerPhone || !customerAddress) {
        return {
          success: false,
          requiresAuth: true,
          message: 'Please sign in and provide your shipping address to place your order.'
        };
      }

      const orderId = 'RAM-2026-' + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        orderId,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        total: summary.payable,
        subtotal: summary.subtotal,
        discount: summary.couponDiscount,
        gstAmount: summary.gstAmount,
        paymentMethod: checkoutDetails.paymentMethod || 'UPI / Razorpay Instant',
        customerName: customerName || 'Verified Patron',
        phone: customerPhone,
        address: customerAddress,
        giftWrap: checkoutDetails.giftWrap !== undefined ? Boolean(checkoutDetails.giftWrap) : true,
        mockupApproved: false,
        status: 'Order Confirmed • Studio Batch Allocated',
        stageIndex: 1,
        stages: ['Order Confirmed', 'Flowers / Materials Prepped', 'Silica & Vacuum Degassing', 'Deep Optical Cast Pour', 'Diamond Polish & Dispatch'],
        items: summary.cart.map(i => ({
          productId: i.productId || 'vk-epx-301',
          name: `${i.name} (${i.variantLabel})`,
          qty: i.qty,
          price: i.price,
          customNote: i.customNote
        })),
        courier: `BlueDart Priority Air • PIN ${this.getPincodeInfo().pin}`
      };
      const orders = [newOrder, ...this.getOrders()];
      safeWrite(STORAGE_KEYS.ORDERS, orders);
      callCloudflareEdge('/orders', 'POST', newOrder);
      this.clearCart();
      this.notify('order_placed', newOrder);
      return { success: true, order: newOrder };
    },

    // External Studio Bridge Receiver for Live Catalogue Drops & Customer Order Updates
    receiveStudioPush(payload) {
      if (!payload || typeof payload !== 'object') return { ok: false, error: 'Invalid payload' };
      const log = safeRead(STORAGE_KEYS.STUDIO_SYNC_LOG, []);
      const entry = {
        id: 'push_' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: payload.type || payload.action || 'CATALOG_AND_SOCIAL_SYNC',
        summary: payload.summary || 'Studio catalogue & order state updated'
      };

      const targetProduct = payload.product || (payload.action === 'STUDIO_UPSERT_PRODUCT' || payload.action === 'ADMIN_UPSERT_PRODUCT' ? payload.payload : null);
      if (targetProduct && targetProduct.id) {
        const products = this.getProducts().slice();
        const normalizedProd = {
          ...targetProduct,
          image: targetProduct.image || (targetProduct.images && targetProduct.images[0]) || IMAGES.ultraclearMain,
          gallery: targetProduct.gallery || targetProduct.images || [IMAGES.ultraclearMain]
        };
        const idx = products.findIndex(p => p.id === normalizedProd.id);
        if (idx > -1) products[idx] = { ...products[idx], ...normalizedProd };
        else products.unshift(normalizedProd);
        safeWrite(STORAGE_KEYS.PRODUCTS, products);
      }

      if ((payload.action === 'STUDIO_UPDATE_PRICE_STOCK' || payload.action === 'ADMIN_UPDATE_PRICE_STOCK') && payload.payload && payload.payload.id) {
        const products = this.getProducts().slice();
        const idx = products.findIndex(p => p.id === payload.payload.id);
        if (idx > -1) {
          products[idx] = { ...products[idx], ...payload.payload };
          safeWrite(STORAGE_KEYS.PRODUCTS, products);
        }
      }

      const targetOrder = payload.order || (payload.action === 'STUDIO_UPDATE_ORDER_STATUS' || payload.action === 'ADMIN_UPDATE_ORDER_STATUS' ? payload.payload : null);
      if (targetOrder && targetOrder.orderId) {
        const orders = this.getOrders().slice();
        const idx = orders.findIndex(o => o.orderId === targetOrder.orderId);
        if (idx > -1) {
          orders[idx] = { ...orders[idx], ...targetOrder };
        } else {
          orders.unshift(targetOrder);
        }
        safeWrite(STORAGE_KEYS.ORDERS, orders);
      }

      const targetPost = payload.socialPost || (payload.action === 'STUDIO_PUSH_SOCIAL_POST' || payload.action === 'ADMIN_PUSH_SOCIAL_POST' ? payload.payload : null);
      if (targetPost) {
        const posts = this.getSocialPosts().slice();
        posts.unshift(targetPost);
        safeWrite(STORAGE_KEYS.SOCIAL_POSTS, posts);
      }

      log.unshift(entry);
      safeWrite(STORAGE_KEYS.STUDIO_SYNC_LOG, log.slice(0, 20));
      this.notify('studio_push_received', { entry, payload });
      return { ok: true, entry };
    },

    // Backward compatibility alias for receiveStudioPush
    receiveAdminPush(payload) {
      return this.receiveStudioPush(payload);
    },

    getStudioSyncLog() {
      return safeRead(STORAGE_KEYS.STUDIO_SYNC_LOG, [
        { id: 'push_init', timestamp: 'Just now', type: 'STUDIO_SYNC_READY', summary: 'Listening for Studio catalogue updates & Realtime drops' }
      ]);
    },

    getHostPushLog() {
      return this.getStudioSyncLog();
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    notify(event, data) {
      listeners.forEach(fn => {
        try { fn(event, data); } catch (e) { console.error(e); }
      });
    }
  };

  // Setup Cross-Window / BroadcastChannel Listener for Live Studio Drops
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('RAM_STUDIO_LIVE_DROP_CHANNEL');
      channel.onmessage = (ev) => {
        if (ev && ev.data) Store.receiveStudioPush(ev.data);
      };
    }
    global.addEventListener('message', (ev) => {
      if (ev && ev.data && (ev.data.source === 'RAM_STUDIO_BRIDGE' || ev.data.source === 'RAM_ADMIN_HOST')) {
        Store.receiveStudioPush(ev.data.payload);
      }
    });
  } catch (e) {
    // ignore in restricted environments
  }

  global.ResinStore = Store;
  global.StorefrontBridge = Store;
})(window);
