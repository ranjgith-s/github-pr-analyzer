import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
  Snippet,
  Divider,
  ButtonGroup,
} from '@heroui/react';
import {
  ShareIcon,
  ClipboardIcon,
  CheckIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

export interface ShareQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  resultCount?: number;
}

export function ShareQueryModal({
  isOpen,
  onClose,
  query,
  resultCount,
}: ShareQueryModalProps) {
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(query)}`;

  const shareText = `${title || 'Check out this GitHub PR search'}: ${query}${
    resultCount !== undefined ? ` (${resultCount} results)` : ''
  }`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShareViaTwitter = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank'
    );
  };

  const handleShareViaSlack = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`slack://channel?team=&id=&message=${text}`, '_blank');
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(title || 'GitHub PR Search Query');
    const body = encodeURIComponent(
      `${description || shareText}\n\n${shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <ShareIcon className="h-5 w-5" />
          Share Query
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Query Preview */}
          <Card shadow="sm">
            <CardBody className="p-4">
              <div className="text-sm text-default-500 mb-2">Query:</div>
              <code className="text-sm bg-default-100 p-2 rounded block break-all">
                {query}
              </code>
              {resultCount !== undefined && (
                <div className="text-xs text-default-500 mt-2">
                  {resultCount} result{resultCount !== 1 ? 's' : ''}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Customization */}
          <div className="space-y-3">
            <Input
              label="Title (optional)"
              placeholder="My awesome PR search"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="bordered"
            />
            <Textarea
              label="Description (optional)"
              placeholder="Additional context about this search..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="bordered"
              minRows={2}
            />
          </div>

          <Divider />

          {/* Share URL */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Share URL</div>
            <div className="flex gap-2">
              <Snippet
                symbol=""
                className="flex-1"
                variant="bordered"
                codeString={shareUrl}
              >
                {shareUrl}
              </Snippet>
              <Button
                size="md"
                variant="bordered"
                isIconOnly
                onPress={handleCopyUrl}
                color={copied ? 'success' : 'default'}
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <ClipboardIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Divider />

          {/* Social Sharing */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Share via</div>
            <ButtonGroup variant="bordered" className="w-full">
              <Button
                className="flex-1"
                startContent={
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                }
                onPress={handleShareViaTwitter}
              >
                Twitter
              </Button>
              <Button
                className="flex-1"
                startContent={
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" />
                  </svg>
                }
                onPress={handleShareViaSlack}
              >
                Slack
              </Button>
              <Button
                className="flex-1"
                startContent={<LinkIcon className="h-4 w-4" />}
                onPress={handleShareViaEmail}
              >
                Email
              </Button>
            </ButtonGroup>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
