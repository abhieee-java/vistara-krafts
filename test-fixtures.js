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

export const TEST_PRODUCTS = [
    {
      id: 'ram-keep-001',
      sku: 'RAM-VRM-BLK-12',
      name: 'Eternal Varmala & Bridal Bouquet Time-Capsule Block',
      shortName: 'Eternal Varmala Resin Block',
      subtitle: 'Museum-Grade 50mm Deep Optical Cast with 24K Gold Leaf & Custom Brass Calligraphy',
      category: 'keepsakes',
      subCategory: 'floral_preservation',
      relatedCategories: ['deep_pour'],
      genderAffinity: 'feminine',
      giftingTags: ['bridal', 'wedding', 'anniversary', 'gifts-for-her', 'keepsake'],
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
      colors: [
        { id: 'c-gold-leaf', label: '24K Gold Leaf & Crystal Clear', hex: '#d4af37', accent: '#fcf8ea' },
        { id: 'c-blush-rose', label: 'Blush Rose & Champagne', hex: '#f7d6d0', accent: '#e8a598' },
        { id: 'c-emerald-silver', label: 'Emerald Agate & Silver Leaf', hex: '#164e3f', accent: '#94a3b8' },
        { id: 'c-royal-indigo', label: 'Royal Indigo & Silver Foil', hex: '#1e3a8a', accent: '#dbeafe' },
        { id: 'c-ultraclear', label: 'UltraClear Archival Diamond', hex: '#e0f2fe', accent: '#0284c7' }
      ],
      shapes: [
        { id: 's-arch', label: 'Mughal Arch', icon: 'account_balance' },
        { id: 's-cube', label: 'Romantic Cube', icon: 'crop_square' },
        { id: 's-hex', label: 'Geode Hexagon', icon: 'hexagon' },
        { id: 's-round', label: 'Heirloom Disc', icon: 'radio_button_unchecked' },
        { id: 's-heart', label: 'Heart Keepsake', icon: 'favorite' }
      ],
      sizes: [
        { id: 'sz-8in', label: '8" Romantic Cube (Desk Mini)', desc: 'Preserves 8–12 roses + couple name tag', priceDelta: 0 },
        { id: 'sz-12in', label: '12" Royal Heirloom Block', desc: 'Full Varmala + 24K gold flakes + warm LED stand', priceDelta: 1500, popular: true },
        { id: 'sz-16in', label: '16" Gallery Mantel Frame', desc: 'Dual garland preservation + 2 complimentary coasters', priceDelta: 4000 }
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
      genderAffinity: 'neutral',
      giftingTags: ['epoxy-system', 'studio-kit', 'diy-craft', 'gifts-for-him', 'gifts-for-her'],
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
      colors: [
        { id: 'c-clear', label: 'UltraClear Optical (Diamond Pure)', hex: '#f0f9ff', accent: '#0284c7' },
        { id: 'c-ocean-blue', label: 'Ocean Lagoon Tint Kit', hex: '#0284c7', accent: '#bae6fd' },
        { id: 'c-emerald', label: 'Emerald Forest Tint Kit', hex: '#059669', accent: '#a7f3d0' },
        { id: 'c-smoke-black', label: 'Obsidian Smoke Tint Kit', hex: '#1e293b', accent: '#94a3b8' }
      ],
      shapes: [
        { id: 's-pour', label: 'Liquid Bottle Set', icon: 'science' },
        { id: 's-jug', label: 'Studio Ergonomic Jug', icon: 'local_drink' }
      ],
      sizes: [
        { id: 'sz-400g', label: '400g Starter Kit', desc: '300g Resin + 100g Hardener', priceDelta: -750 },
        { id: 'sz-1200g', label: '1.2kg Studio Pack', desc: '900g Resin + 300g Hardener', priceDelta: 0, popular: true },
        { id: 'sz-4000g', label: '4.0kg Bulk Workshop Kit', desc: '3kg Resin + 1kg Hardener', priceDelta: 2500 },
        { id: 'sz-12000g', label: '12kg Commercial Pack', desc: '9kg Resin + 3kg Hardener', priceDelta: 8700 }
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
      genderAffinity: 'masculine',
      giftingTags: ['gifts-for-him', 'barware', 'teak-wood', 'ocean-decor', 'luxury-home'],
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
      colors: [
        { id: 'c-maldives', label: 'Maldives Deep Navy & Turquoise', hex: '#0a1c30', accent: '#0284c7' },
        { id: 'c-caribbean', label: 'Caribbean Emerald & Aqua Foam', hex: '#0f766e', accent: '#14b8a6' },
        { id: 'c-midnight', label: 'Midnight Obsidian & Gold Leaf', hex: '#18181b', accent: '#d4af37' },
        { id: 'c-sunset', label: 'Sunset Coral & Copper Sparkle', hex: '#be123c', accent: '#fb7185' }
      ],
      shapes: [
        { id: 's-platter', label: '14" Teak Serving Board', icon: 'crop_portrait' },
        { id: 's-charcuterie', label: '18" Live-Edge Charcuterie Paddle', icon: 'straighten' },
        { id: 's-round-tray', label: '12" Round Vanity Platter', icon: 'radio_button_unchecked' }
      ],
      sizes: [
        { id: 'sz-std', label: 'Standard 14" Teak Tray', desc: 'Burma Teak + 3-layer ocean foam lacing', priceDelta: 0, popular: true },
        { id: 'sz-combo', label: 'Grand 18" Board + 4 Coasters Combo', desc: 'Complete entertaining table ensemble', priceDelta: 1000 }
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
      genderAffinity: 'masculine',
      giftingTags: ['gifts-for-him', 'woodworking', 'river-table', 'deep-pour', 'workshop'],
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
      colors: [
        { id: 'c-clear', label: 'Water-Clear Optical Glass', hex: '#f8fafc', accent: '#0ea5e9' },
        { id: 'c-smoke', label: 'Smoky Charcoal Tint', hex: '#334155', accent: '#64748b' },
        { id: 'c-caribbean', label: 'Turquoise River Tint', hex: '#0e7490', accent: '#06b6d4' },
        { id: 'c-walnut', label: 'Deep Amber Coffee Tint', hex: '#78350f', accent: '#b45309' }
      ],
      shapes: [
        { id: 's-deep', label: 'Deep Pour Cast System', icon: 'layers' },
        { id: 's-table', label: 'Live-Edge Slab Format', icon: 'table_restaurant' }
      ],
      sizes: [
        { id: 'sz-3kg', label: '3.0kg Dual Pack', desc: '2kg Resin + 1kg Hardener • Floral Blocks & Small Tables', priceDelta: 0, popular: true },
        { id: 'sz-9kg', label: '9.0kg Furniture Studio Kit', desc: '6kg Resin + 3kg Hardener • Live-Edge River Tables', priceDelta: 5149 }
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
      genderAffinity: 'feminine',
      giftingTags: ['gifts-for-her', 'wall-art', 'crystals', 'geode', 'luxury-living'],
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
      colors: [
        { id: 'c-champagne', label: 'Royal Champagne & Rose Gold', hex: '#f7d6d0', accent: '#d4af37' },
        { id: 'c-emerald', label: 'Emerald Agate & Silver Quartz', hex: '#064e3b', accent: '#a7f3d0' },
        { id: 'c-obsidian', label: 'Obsidian Black & 24K Gold Veins', hex: '#09090b', accent: '#eab308' },
        { id: 'c-amethyst', label: 'Amethyst Lilac & Pearl Luster', hex: '#581c87', accent: '#d8b4fe' }
      ],
      shapes: [
        { id: 's-round', label: '18" Round Geode Canvas', icon: 'radio_button_unchecked' },
        { id: 's-hex', label: '20" Hexagonal Geode Specimen', icon: 'hexagon' },
        { id: 's-grand', label: '24" Architectural Statement Panel', icon: 'crop_square' }
      ],
      sizes: [
        { id: 'sz-18in', label: '18" Round Geode Canvas / Clock', desc: 'Silent sweep brass hands + raw quartz clusters', priceDelta: 0, popular: true },
        { id: 'sz-24in', label: '24" Architectural Statement Panel', desc: 'Backlit warm LED halo + champagne druzy rim', priceDelta: 2600 }
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
      genderAffinity: 'feminine',
      giftingTags: ['gifts-for-her', 'jewelry-making', 'uv-resin', 'diy-craft', 'pressed-flowers'],
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
      colors: [
        { id: 'c-crystal', label: 'Diamond Hard Optical Clear', hex: '#f8fafc', accent: '#38bdf8' },
        { id: 'c-sparkle', label: 'Holographic Micro-Glitter Base', hex: '#fdf4ff', accent: '#f472b6' }
      ],
      shapes: [
        { id: 's-nozzle', label: 'Precision Needle Tip Bottle', icon: 'colorize' },
        { id: 's-twin', label: 'Twin Studio Duo + UV Lamp', icon: 'wb_incandescent' }
      ],
      sizes: [
        { id: 'sz-100g', label: '100g Precision Nozzle Bottle', desc: 'Ideal for 25–30 botanical pendants', priceDelta: -270 },
        { id: 'sz-200g', label: '200g Studio Twin Pack + UV Torch', desc: 'Includes 365nm mini curing lamp', priceDelta: 0, popular: true }
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
      genderAffinity: 'feminine',
      giftingTags: ['gifts-for-her', 'pigments', 'colorist', 'shimmer', 'art-supplies'],
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
      colors: [
        { id: 'c-aurora', label: 'Aurora Teal & Rose Shifter', hex: '#14b8a6', accent: '#f43f5e' },
        { id: 'c-sunset', label: 'Solar Flare Gold & Copper', hex: '#eab308', accent: '#f97316' },
        { id: 'c-emerald', label: 'Emerald Agate & Indigo', hex: '#059669', accent: '#6366f1' },
        { id: 'c-amethyst', label: 'Amethyst & Galaxy Blue', hex: '#8b5cf6', accent: '#3b82f6' }
      ],
      shapes: [
        { id: 's-jar', label: 'Apothecary Glass Jars', icon: 'science' },
        { id: 's-vault', label: 'Collector Vault Box', icon: 'inventory_2' }
      ],
      sizes: [
        { id: 'sz-12', label: '12 × 10g Apothecary Jars', desc: 'Aurora Teal, Rose Gold, Emerald, Copper & more', priceDelta: 0, popular: true },
        { id: 'sz-24', label: '24 × 10g Master Colorist Vault', desc: 'Full spectrum metallic + interference pearl', priceDelta: 700 }
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
      genderAffinity: 'feminine',
      giftingTags: ['gifts-for-her', 'tableware', 'botanical', 'wedding-gift', 'keepsake'],
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
      colors: [
        { id: 'c-rose-gold', label: 'Blush Rose & 24K Gold Foil', hex: '#fce7f3', accent: '#d4af37' },
        { id: 'c-emerald-bloom', label: 'Emerald Agate & White Bloom', hex: '#064e3b', accent: '#e2e8f0' },
        { id: 'c-navy-delphinium', label: 'Pressed Blue Delphinium & Brass', hex: '#1e3a8a', accent: '#fbbf24' },
        { id: 'c-pressed-orchid', label: 'Pressed Orchid & Champagne Leaf', hex: '#701a75', accent: '#fde047' }
      ],
      shapes: [
        { id: 's-agate', label: 'Organic Agate Edge', icon: 'interests' },
        { id: 's-hex', label: 'Geode Hexagon Edge', icon: 'hexagon' },
        { id: 's-round', label: 'Circular Disc with Brass Rim', icon: 'radio_button_unchecked' }
      ],
      sizes: [
        { id: 'sz-4pc', label: 'Set of 4 Coasters + Brass Holder', desc: 'Includes brass holder stand', priceDelta: 0, popular: true },
        { id: 'sz-6pc', label: 'Set of 6 Coasters + Brass Holder', desc: 'Entertaining ensemble for dining tables', priceDelta: 499 }
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
      genderAffinity: 'neutral',
      giftingTags: ['topcoat', 'doming', 'high-gloss', 'formula', 'diy-craft'],
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
      colors: [
        { id: 'c-glass', label: 'Liquid Glass Mirror Crystal', hex: '#f0fdf4', accent: '#15803d' },
        { id: 'c-pearl', label: 'Subtle Pearl Shimmer Glaze', hex: '#fafaf9', accent: '#a8a29e' }
      ],
      shapes: [
        { id: 's-canister', label: 'Equal Vol Twin Bottles', icon: 'view_in_ar' },
        { id: 's-jug', label: 'Workshop Jug Duo', icon: 'local_drink' }
      ],
      sizes: [
        { id: 'sz-500g', label: '500g Surface Kit', desc: '250g Resin + 250g Hardener', priceDelta: 0, popular: true },
        { id: 'sz-2kg', label: '2.0kg Studio Topcoat Pack', desc: '1kg Resin + 1kg Hardener', priceDelta: 1700 }
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
      genderAffinity: 'neutral',
      giftingTags: ['molds', 'silicone', 'geode', 'craft-tools', 'studio'],
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
      colors: [
        { id: 'c-translucent', label: 'Platinum Translucent Silicone', hex: '#f1f5f9', accent: '#64748b' },
        { id: 'c-cyan', label: 'Ocean Teal Silicone', hex: '#0f766e', accent: '#2dd4bf' }
      ],
      shapes: [
        { id: 's-agate', label: 'Agate Edge 4-Cavity Mould', icon: 'interests' },
        { id: 's-block', label: '8" × 8" Floral Block Mould', icon: 'crop_square' }
      ],
      sizes: [
        { id: 'sz-4cav', label: 'Set of 4 Agate Coaster Cavities', desc: '12mm depth • Natural live geode rim', priceDelta: 0, popular: true },
        { id: 'sz-deep', label: '8" × 8" × 2.5" Deep Floral Block Mold', desc: 'Reinforced non-bowing walls for varmala blocks', priceDelta: 750 }
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
      genderAffinity: 'neutral',
      giftingTags: ['bio-based', 'plant-derived', 'eco-friendly', 'zero-voc', 'home-studio'],
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
      colors: [
        { id: 'c-eco-clear', label: 'Plant-Derived Optical Clear', hex: '#ecfdf5', accent: '#059669' },
        { id: 'c-sage', label: 'Forest Sage Micro-Tint', hex: '#064e3b', accent: '#34d399' }
      ],
      shapes: [
        { id: 's-eco-jug', label: 'Eco-Recycled Pour Bottle', icon: 'eco' }
      ],
      sizes: [
        { id: 'sz-1kg', label: '1.0kg Bio-Craft Kit', desc: '750g Bio Resin + 250g Hardener', priceDelta: 0, popular: true }
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
      genderAffinity: 'masculine',
      giftingTags: ['gifts-for-him', 'ceramics', 'stoneware', 'architectural', 'barware'],
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
      colors: [
        { id: 'c-ochre', label: 'Ochre Sand & Iron Glaze', hex: '#b45309', accent: '#d97706' },
        { id: 'c-basalt', label: 'Charcoal Basalt & Matte Slate', hex: '#18181b', accent: '#71717a' },
        { id: 'c-terracotta', label: 'Sienna Terracotta & Brass Leaf', hex: '#9a3412', accent: '#ea580c' }
      ],
      shapes: [
        { id: 's-pitcher', label: 'Ridged Studio Pitcher', icon: 'wine_bar' },
        { id: 's-carafe', label: 'Compact Table Carafe', icon: 'local_cafe' }
      ],
      sizes: [
        { id: 'sz-12l', label: '1.2L Standard Pitcher', desc: 'Wheel-thrown • 4–6 servings', priceDelta: 0, popular: true },
        { id: 'sz-08l', label: '0.8L Compact Carafe', desc: 'Wheel-thrown • 2–3 servings', priceDelta: -500 }
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
export default TEST_PRODUCTS;
