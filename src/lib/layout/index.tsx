'use client';

import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Box margin="0 auto" transition="0.5s ease-out">
      <Box>
        {/* <Header /> */}
        <Box as="main">{children}</Box>
        {/* <Footer /> */}
      </Box>
    </Box>
  );
};
