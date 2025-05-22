// ui-react/src/theme/componentTokens.ts

import { blue, geekblue, gray } from '@ant-design/colors';
import { ComponentStyleConfig } from 'antd/es/config-provider/context';

// const fullToken = defaultTheme.getDerivativeToken(defaultConfig.token);

export namespace ComponentsTheme {
	export const Layout = {
		// colorBgLayout: gray[0],
		colorText: geekblue[10], //'rgba(0, 0, 0, 0.88)',
		headerBg: geekblue[1],
		// lightSiderBg: ,
	};

	export const LayoutHeader = {
		headerBg: gray[0],
		// colorBgHeader: '#000',
		colorText: geekblue[8],
		// colorText: 'black',
		height: 48, // base 64px
		paddingInline: 24,
		paddingBlock: 0,
	};

	export const Space = {
		gap: 16,
	};

	export const Collapse = {
		headerBg: 'rgba(10, 10, 20, 0.01)',
		contentPadding: 8,
		contentBg: '#fff',
		// contentBg: geekblue[2];
		borderlessContentBg: geekblue[1],
	}

	export const Typography = {
		titleMarginBottom: 0,
	}

}
