// ui-react/src/theme/customTheme.ts

import { theme, ThemeConfig } from "antd";
import { ComponentsTheme } from "./componentTokens";
import { AliasToken } from "antd/es/theme/internal";
import { defaultConfig, defaultTheme } from "antd/es/theme/context";
import { MappingAlgorithm, OverrideToken } from "antd/es/theme/interface";
// const { defaultSeed } = theme;

// const fullToken = defaultTheme.getDerivativeToken(defaultConfig.token);
// console.log(fullToken, defaultConfig.token, theme.defaultSeed);

const token: Partial<AliasToken> = {
	// Background Colors
	// colorFillContentHover: fullToken.gray1, // Content area background color on hover
	// colorFillAlter: fullToken.blue0, // Alternative background color
	colorBgLayout: '#fff',

	// layout-header-bg)
	// colorFillContent: '#ffffff', // Content area background color
	// colorBgContainerDisabled: '#d9d9d9', // Disabled container background color
	// colorBgTextHover: '#f4f4f4', // Text hover background color
	// colorBgTextActive: '#dcdcdc', // Text active background color
	// colorBorderBg: '#d1d1d1', // Background border color
	// colorSplit: 'rgba(0, 0, 0, 0.1)', // Separator color
	// colorTextPlaceholder: '#a0a0a0', // Placeholder text color
	// colorTextDisabled: '#bfbfbf', // Disabled text color
	// colorTextHeading: '#333333', // Heading text color
	// colorTextLabel: '#666666', // Text label font color
	// colorTextDescription: '#999999', // Text description font color
	// colorTextLightSolid: '#007bff', // Fixed text highlight color
	// colorIcon: '#999999', // Weak action icon color
	// colorIconHover: '#555555', // Weak action icon hover color
	// colorHighlight: '#ffcc00', // Highlight color
	// controlOutline: '#40a9ff', // Input component outline color
	// colorWarningOutline: '#faad14', // Warning outline color
	// colorErrorOutline: '#f5222d', // Error outline color

	// // Font Sizes
	// fontSizeIcon: 16, // Operation icon font size
	// fontWeightStrong: 600, // Font weight for heading components or selected items

	// // Outline Widths
	// controlOutlineWidth: 2, // Input component outline width
	// lineWidthFocus: 2, // Line width on focus state

	// // Padding Sizes
	// paddingXXS: 2, // Extra extra small padding
	// paddingXS: 4, // Extra small padding
	// paddingSM: 8, // Small padding
	// padding: 12, // Regular padding
	// paddingMD: 16, // Medium padding
	// paddingLG: 24, // Large padding
	// paddingXL: 32, // Extra large padding
	// paddingContentHorizontalLG: 48, // Content horizontal padding (LG)
	// paddingContentHorizontal: 24, // Content horizontal padding
	// paddingContentHorizontalSM: 16, // Content horizontal padding (SM)
	// paddingContentVerticalLG: 48, // Content vertical padding (LG)
	// paddingContentVertical: 24, // Content vertical padding
	// paddingContentVerticalSM: 16, // Content vertical padding (SM)

	// Margin Sizes
	// marginXXS: 2, // Extra extra small margin
	// marginXS: 4, // Extra small margin
	// marginSM: 8, // Small margin
	// margin: 12, // Regular margin
	// marginMD: 16, // Medium margin
	// marginLG: 24, // Large margin
	// marginXL: 32, // Extra large margin
	// marginXXL: 48, // Extra extra large margin

	// Opacities
	// opacityLoading: 0.5, // Loading state opacity

	// // Box Shadows
	// boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)', // Box shadow
	// boxShadowSecondary: '0px 4px 12px rgba(0, 0, 0, 0.1)', // Secondary box shadow
	// boxShadowTertiary: '0px 6px 16px rgba(0, 0, 0, 0.05)', // Tertiary box shadow

	// // Link Text Decorations
	// linkDecoration: 'underline', // Link text decoration
	// linkHoverDecoration: 'none', // Link text decoration on hover
	// linkFocusDecoration: 'underline', // Link text decoration on focus

	// // Control Padding Sizes
	// controlPaddingHorizontal: 16, // Control component horizontal padding
	// controlPaddingHorizontalSM: 8, // Control component horizontal padding (SM)

	// Screen Sizes (pixels)
	// screenXS: 320, // Extra small screens width
	// screenXSMin: 320, // Extra small screens minimum width
	// screenXSMax: 479, // Extra small screens maximum width
	// screenSM: 576, // Small screens width
	// screenSMMin: 576, // Small screens minimum width
	// screenSMMax: 767, // Small screens maximum width
	// screenMD: 768, // Medium screens width
	// screenMDMin: 768, // Medium screens minimum width
	// screenMDMax: 1023, // Medium screens maximum width
	// screenLG: 1024, // Large screens width
	// screenLGMin: 1024, // Large screens minimum width
	// screenLGMax: 1279, // Large screens maximum width
	// screenXL: 1280, // Extra large screens width
	// screenXLMin: 1280, // Extra large screens minimum width
	// screenXLMax: 1535, // Extra large screens maximum width
	// screenXXL: 1536, // Extra extra large screens width
	// screenXXLMin: 1536, // Extra extra large screens minimum width
};

type ComponentsConfig = {
	[key in keyof OverrideToken]?: OverrideToken[key] & {
		algorithm?: boolean | MappingAlgorithm | MappingAlgorithm[];
	};
}

const components: ComponentsConfig = {
	Layout: ComponentsTheme.Layout,
	// LayoutHeader: ComponentsTheme.LayoutHeader,
	Space: ComponentsTheme.Space,
	Collapse: ComponentsTheme.Collapse,
	Typography: ComponentsTheme.Typography,
};

export const customTheme: ThemeConfig = {
	cssVar: true,
	algorithm: theme.compactAlgorithm,
	token,
	components,
};