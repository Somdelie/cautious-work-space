import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface OrderAlertEmailProps {
  adminName?: string;
  orderId: string;
  customerName: string;
  amount: string;
  status: string;
  actionUrl: string;
}

export default function OrderAlertEmail({
  adminName = "Admin",
  orderId,
  customerName,
  amount,
  status,
  actionUrl,
}: OrderAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New order requires your attention – Order #{orderId}</Preview>

      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Heading style={heading}>Order Checks Admin</Heading>

          <Text style={subheading}>Order review notification</Text>

          <Hr style={divider} />

          {/* Greeting */}
          <Text style={text}>
            Hello <strong>{adminName}</strong>,
          </Text>

          <Text style={text}>
            A new order has been submitted and requires administrative review.
          </Text>

          {/* Order Summary */}
          <Section style={card}>
            <Text style={cardItem}>
              <strong>Order ID:</strong> #{orderId}
            </Text>
            <Text style={cardItem}>
              <strong>Customer:</strong> {customerName}
            </Text>
            <Text style={cardItem}>
              <strong>Amount:</strong> {amount}
            </Text>
            <Text style={cardItem}>
              <strong>Status:</strong> {status}
            </Text>
          </Section>

          {/* CTA */}
          <Button href={actionUrl} style={button}>
            Review Order
          </Button>

          <Text style={muted}>
            If the button doesn’t work, copy and paste this link into your
            browser:
          </Text>

          <Text style={link}>{actionUrl}</Text>

          <Hr style={divider} />

          {/* Footer */}
          <Text style={footer}>
            This email was generated automatically by Order Checks Admin. Please
            do not reply.
          </Text>

          <Text style={footerMuted}>
            © {new Date().getFullYear()} Order Checks Admin
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* ================= STYLES ================= */

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  borderRadius: "10px",
  maxWidth: "520px",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
};

const heading = {
  fontSize: "26px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "0",
  color: "#0f172a",
};

const subheading = {
  fontSize: "14px",
  textAlign: "center" as const,
  color: "#64748b",
  marginTop: "6px",
};

const text = {
  fontSize: "15px",
  color: "#334155",
  lineHeight: "1.6",
};

const divider = {
  margin: "24px 0",
  borderColor: "#e2e8f0",
};

const card = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "16px",
};

const cardItem = {
  fontSize: "14px",
  margin: "6px 0",
  color: "#0f172a",
};

const button = {
  display: "block",
  width: "100%",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  padding: "12px 0",
  borderRadius: "8px",
  textAlign: "center" as const,
  fontSize: "15px",
  fontWeight: "600",
  marginTop: "24px",
};

const muted = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "16px",
};

const link = {
  fontSize: "12px",
  color: "#2563eb",
  wordBreak: "break-all" as const,
};

const footer = {
  fontSize: "12px",
  color: "#475569",
  textAlign: "center" as const,
};

const footerMuted = {
  fontSize: "11px",
  color: "#94a3b8",
  textAlign: "center" as const,
  marginTop: "6px",
};
