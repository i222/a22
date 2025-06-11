import React, { Component, ReactNode } from 'react';
import { Result, Layout, Typography } from 'antd';

const { Content } = Layout;
const { Paragraph, Text } = Typography;

/**
 * ErrorBoundary
 *
 * Catches JavaScript rendering errors in child components and displays a styled Ant Design fallback UI.
 */
interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			errorMessage: '',
		};
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			errorMessage: error.message,
		};
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error('Error caught by ErrorBoundary:', error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<Layout style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
					<Content style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
						<Result
							status="404"
							title="Oops! Something went wrong."
							subTitle="The application encountered an unexpected error."
						>
							<Paragraph>
								<Text type="danger">{this.state.errorMessage}</Text>
							</Paragraph>
						</Result>
					</Content>
				</Layout>
			);
		}

		return this.props.children;
	}
}

export { ErrorBoundary };
