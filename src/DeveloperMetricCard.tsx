import React from 'react';
import { Box, Heading, Text, Badge } from '@heroui/react';

interface Props {
  name: string;
  brief: string;
  details: string;
  valueDesc: string;
  score: number | null;
  value: number;
  format?: (n: number) => string;
}

export default function DeveloperMetricCard({
  name,
  brief,
  details,
  valueDesc,
  score,
  value,
  format,
}: Props) {
  const variant =
    score === null
      ? 'default'
      : score < 3
        ? 'danger'
        : score <= 8
          ? 'attention'
          : 'success';
  return (
    <Box
      borderWidth={1}
      borderStyle="solid"
      borderColor="border.default"
      borderRadius={2}
      p={2}
    >
      <Heading
        as="h3"
        sx={{
          fontSize: 1,
          mb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {name}
        {typeof score === 'number' && (
          <Badge variant={variant} size="small">
            {score}
          </Badge>
        )}
      </Heading>
      <Text sx={{ fontSize: 1 }}>{brief}</Text>
      <Text as="p" sx={{ mt: 1, color: 'fg.muted', fontSize: 0 }}>
        {details}
      </Text>
      <Text as="p" sx={{ mt: 1, fontSize: 0 }}>
        <Badge variant={variant} size="small" mr={1}>
          {format ? format(value) : value}
        </Badge>{' '}
        {valueDesc}
      </Text>
    </Box>
  );
}
