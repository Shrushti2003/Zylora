import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Droplets,
  Leaf,
  Recycle,
  Users
} from "lucide-react";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { loadResources, loadStories, type ImpactStory, type ResourceCategory, type ResourceListing } from "../data/mvpData";

const metrics = [
  ["Waste Prevented", "1.8k t", Recycle],
  ["Carbon Saved", "450 t", Leaf],
  ["Water Saved", "2.4M L", Droplets],
  ["Community Impact", "98 cities", Users]
];

type ImpactHistoryPoint = {
  label: string;
  value: number;
  dateKey: string;
};

type ImpactMetric = {
  id: string;
  label: string;
  unit: string;
  description: string;
  colorClass: string;
  chartStyle: "crest" | "wave" | "plateau" | "surge";
  currentValue: string;
  change: number;
  direction: "up" | "down";
  history: ImpactHistoryPoint[];
  summary: string;
};

type TrendBucket = {
  label: string;
  dateKey: string;
};

const categoryWeightMap: Partial<Record<ResourceCategory, number>> = {
  "Construction Materials": 48,
  "Building & Renovation Materials": 44,
  "Furniture": 34,
  "Office Furniture": 29,
  "Clothing & Apparel": 4,
  "Food Donations": 10,
  "Books & Educational Supplies": 6,
  "School Supplies": 5,
  "Electronics": 16,
  "Computers & IT": 18,
  "Mobile Phones & Accessories": 7,
  "Home Appliances": 21,
  "Kitchen Equipment": 12,
  "Bakery Equipment": 15,
  "Musical Instruments": 9,
  "Sports Equipment": 8,
  "Office Equipment": 13,
  "Medical Supplies": 11,
  "Toys & Children's Items": 3,
  "Gardening & Agriculture": 8,
  "Industrial Materials": 28,
  "Packaging Materials": 6,
  "Arts & Craft Supplies": 2,
  "Event & Exhibition Materials": 17,
  "Tools & Hardware": 14,
  "Household Essentials": 10,
  "Safety Equipment": 5,
  "Eco-Friendly Products": 6,
  "Recyclable Materials": 19,
  "Community Resources": 9,
  "NGO Requirements": 7,
  Others: 5
};

const completedStatuses = new Set<ResourceListing["availabilityStatus"]>(["Matched", "Closed"]);
const collectedStatuses = new Set<ResourceListing["availabilityStatus"]>(["Pending Pickup", "Matched", "Closed"]);

export function ImpactDashboardPage() {
  const [resources, setResources] = useState(() => loadResources());
  const [stories, setStories] = useState(() => loadStories());

  useEffect(() => {
    const syncImpactData = () => {
      setResources(loadResources());
      setStories(loadStories());
    };

    window.addEventListener("storage", syncImpactData);
    return () => window.removeEventListener("storage", syncImpactData);
  }, []);

  const liveMetrics = [
    ["Total Resources Shared", String(resources.length), Recycle],
    ["CO2 Saved", `${Math.max(12, resources.length * 4)} t`, Leaf],
    ["Waste Diverted", `${Math.max(18, resources.length * 7)} t`, Recycle],
    ["Families Helped", String(Math.max(80, resources.length * 18)), Users],
    ["NGOs Supported", String(Math.max(9, stories.length + 8)), Users],
    ["Active Listings", String(resources.length), BarChart3]
  ] as const;

  const impactMetrics = buildImpactMetrics(resources, stories);

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Impact tracking"
        title="Impact Tracking"
        description="Measure the real-world value created through reuse and redistribution. Track waste diverted, recycling growth, carbon reduction, and resource recovery across your community."
        image="/Impact.png"
        imageAlt="Environmental recovery and community sustainability"
      >
        <div className="grid gap-4 md:grid-cols-4">
          {[...metrics, ...liveMetrics].map(([label, value, Icon]) => (
            <SurfaceCard key={label as string}>
              <Icon className="h-6 w-6 text-secondary" />
              <p className="mt-4 text-3xl font-bold text-primary">{value as string}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{label as string}</p>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard className="impact-analytics-shell mt-6">
          <div className="impact-analytics-header">
            <div>
              <p className="impact-analytics-eyebrow">Diversion trend</p>
              <h2>Live circular impact dashboard</h2>
              <p>Platform activity from collected, reused, redistributed, donated, recycled, and successfully claimed items.</p>
            </div>
            <div className="impact-analytics-badge">
              <BarChart3 className="h-5 w-5" />
              <span>Auto-updating from platform activity</span>
            </div>
          </div>

          <div className="impact-dashboard-grid">
            {impactMetrics.map((metric, index) => (
              <ImpactMetricCard key={metric.id} metric={metric} index={index} />
            ))}
          </div>
        </SurfaceCard>
      </PageShell>
    </PlatformLayout>
  );
}

function ImpactMetricCard({ metric, index }: { metric: ImpactMetric; index: number }) {
  const [activeIndex, setActiveIndex] = useState(metric.history.length - 1);
  const activePoint = metric.history[activeIndex] ?? metric.history[metric.history.length - 1];
  const TrendIcon = metric.direction === "up" ? ArrowUpRight : ArrowDownRight;

  useEffect(() => {
    setActiveIndex(metric.history.length - 1);
  }, [metric.history]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className={`impact-metric-card ${metric.colorClass}`}
    >
      <div className="impact-metric-header">
        <div>
          <p className="impact-metric-label">{metric.label}</p>
          <h3>{metric.currentValue}</h3>
        </div>
        <div className={`impact-metric-trend ${metric.direction}`}>
          <TrendIcon className="h-4 w-4" />
          <span>{formatSignedPercent(metric.change)}</span>
        </div>
      </div>

      <p className="impact-metric-description">{metric.description}</p>

      <div className="impact-metric-chart-wrap">
        <ImpactAreaChart
          metric={metric}
          activeIndex={activeIndex}
          onActivate={setActiveIndex}
        />
        <div className="impact-metric-chart-meta">
          <span>{activePoint.label}</span>
          <strong>
            {formatCompactValue(activePoint.value)}
            {metric.unit}
          </strong>
        </div>
      </div>

      <div className="impact-metric-footer">
        <span>{metric.summary}</span>
        <span>{metric.history[0]?.label} - {metric.history[metric.history.length - 1]?.label}</span>
      </div>
    </motion.article>
  );
}

function ImpactAreaChart({
  metric,
  activeIndex,
  onActivate
}: {
  metric: ImpactMetric;
  activeIndex: number;
  onActivate: (index: number) => void;
}) {
  const width = 320;
  const height = 168;
  const paddingX = 10;
  const paddingY = 16;
  const values = metric.history.map((point) => point.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const stepX = metric.history.length > 1 ? (width - paddingX * 2) / (metric.history.length - 1) : 0;

  const coordinates = metric.history.map((point, index) => {
    const x = paddingX + index * stepX;
    const y = height - paddingY - ((point.value - minValue) / range) * (height - paddingY * 2);
    return { x, y, point };
  });

  const strokePath = createChartPath(coordinates, metric.chartStyle);
  const areaBaseY = height - paddingY;
  const areaPath = `${strokePath} L ${coordinates[coordinates.length - 1]?.x ?? paddingX} ${areaBaseY} L ${coordinates[0]?.x ?? paddingX} ${areaBaseY} Z`;

  return (
    <div className={`impact-area-chart ${metric.chartStyle}`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label={`${metric.label} trend chart`}>
        <defs>
          <linearGradient id={`${metric.id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.38" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path className="impact-area-fill" d={areaPath} fill={`url(#${metric.id}-fill)`} />
        <path className="impact-area-stroke" d={strokePath} pathLength={1} />
        {coordinates.map(({ x, y }, index) => (
          <g key={`${metric.id}-${metric.history[index]?.dateKey}`}>
            <line x1={x} y1={areaBaseY} x2={x} y2={paddingY} className="impact-area-gridline" />
            <circle
              cx={x}
              cy={y}
              r={index === activeIndex ? 5.5 : 4}
              className={`impact-area-dot ${index === activeIndex ? "active" : ""}`}
            />
          </g>
        ))}
      </svg>

      <div className="impact-area-axis">
        {metric.history.map((point, index) => (
          <button
            key={`${metric.id}-axis-${point.dateKey}`}
            type="button"
            className={index === activeIndex ? "active" : ""}
            onMouseEnter={() => onActivate(index)}
            onFocus={() => onActivate(index)}
            onClick={() => onActivate(index)}
            aria-label={`${metric.label} on ${point.label}: ${formatCompactValue(point.value)}${metric.unit}`}
          >
            {point.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildImpactMetrics(resources: ResourceListing[], stories: ImpactStory[]): ImpactMetric[] {
  const buckets = createTrendBuckets(resources, stories);
  const rawSeries = buckets.map((bucket) => ({
    ...bucket,
    wasteDiverted: 0,
    recyclingGrowth: 0,
    carbonReduction: 0,
    resourceRecovery: 0
  }));
  const storyCount = stories.length;

  resources.forEach((resource) => {
    const bucketIndex = getBucketIndex(resource.postedAt, buckets);
    if (bucketIndex < 0) return;

    const weight = estimateResourceWeight(resource);
    const isCollected = collectedStatuses.has(resource.availabilityStatus);
    const isRecovered = completedStatuses.has(resource.availabilityStatus);
    const isDonation = resource.value === "Donation";
    const isAffordable = resource.value === "Affordable";
    const isRecyclable = resource.category === "Recyclable Materials" || resource.category === "Eco-Friendly Products";

    rawSeries[bucketIndex].wasteDiverted += weight * (isCollected ? 1.18 : 0.34) + (isDonation ? 1.9 : 0.7);
    rawSeries[bucketIndex].recyclingGrowth += (isRecyclable ? weight * 1.42 : weight * 0.1) + (isRecovered ? 1.4 : 0.22);
    rawSeries[bucketIndex].carbonReduction += weight * (isRecovered ? 0.82 : isCollected ? 0.36 : 0.14) + (isDonation ? 1.1 : 0.3);
    rawSeries[bucketIndex].resourceRecovery += weight * (isRecovered ? 0.94 : isCollected ? 0.2 : 0.08) + (isAffordable ? 1.1 : 0.9);
  });

  stories.forEach((story) => {
    const bucketIndex = getBucketIndex(story.createdAt, buckets);
    if (bucketIndex < 0) return;

    rawSeries[bucketIndex].wasteDiverted += 1.1;
    rawSeries[bucketIndex].recyclingGrowth += 0.55;
    rawSeries[bucketIndex].carbonReduction += 0.85;
    rawSeries[bucketIndex].resourceRecovery += 1.45;
  });

  const wasteHistory = shapeMetricHistory(rawSeries.map((bucket) => bucket.wasteDiverted), "crest", 4.6);
  const recyclingHistory = shapeMetricHistory(rawSeries.map((bucket) => bucket.recyclingGrowth), "wave", 1.9);
  const carbonHistory = shapeMetricHistory(rawSeries.map((bucket) => bucket.carbonReduction), "plateau", 2.5);
  const recoveryHistory = shapeMetricHistory(rawSeries.map((bucket) => bucket.resourceRecovery), "surge", 2.8);

  const totals = resources.reduce(
    (accumulator, resource) => {
      const weight = estimateResourceWeight(resource);
      const isCollected = collectedStatuses.has(resource.availabilityStatus);
      const isRecovered = completedStatuses.has(resource.availabilityStatus);
      const isDonation = resource.value === "Donation";
      const isAffordable = resource.value === "Affordable";
      const isRecyclable = resource.category === "Recyclable Materials" || resource.category === "Eco-Friendly Products";

      accumulator.wasteDiverted += weight * (isCollected ? 1.04 : 0.54);
      accumulator.recyclingGrowth += isRecyclable ? weight * 0.92 : weight * 0.18;
      accumulator.carbonReduction += weight * (isRecovered ? 0.6 : 0.26);
      accumulator.resourceRecovery += isRecovered ? weight * 0.76 : weight * 0.24;

      if (isDonation) {
        accumulator.wasteDiverted += 1.5;
        accumulator.carbonReduction += 1.1;
        accumulator.resourceRecovery += 1.3;
      }

      if (isAffordable) {
        accumulator.resourceRecovery += 1.1;
      }

      return accumulator;
    },
    { wasteDiverted: 0, recyclingGrowth: 0, carbonReduction: 0, resourceRecovery: 0 }
  );

  totals.resourceRecovery += storyCount * 2.4;
  totals.wasteDiverted += storyCount * 1.5;
  totals.carbonReduction += storyCount * 0.9;

  const recyclingAlignedListings = resources.filter((resource) => resource.category === "Recyclable Materials" || resource.category === "Eco-Friendly Products").length;
  const collectedCount = resources.filter((resource) => collectedStatuses.has(resource.availabilityStatus)).length;
  const recyclingRate = Math.min(99, ((totals.recyclingGrowth + collectedCount * 2.8 + storyCount * 1.5) / Math.max(resources.length * 3.1, 1)));

  return [
    {
      id: "waste-diverted",
      label: "Waste Diverted",
      unit: " t",
      description: "Collected, donated, and reused items kept in circulation instead of heading to landfill.",
      colorClass: "waste-diverted",
      chartStyle: "crest",
      currentValue: `${formatCompactValue(totals.wasteDiverted)} t`,
      change: calculateChange(wasteHistory),
      direction: calculateDirection(wasteHistory),
      history: buckets.map((bucket, index) => ({
        label: bucket.label,
        dateKey: bucket.dateKey,
        value: wasteHistory[index] ?? 0
      })),
      summary: `${resources.filter((resource) => collectedStatuses.has(resource.availabilityStatus)).length} items collected or reserved`
    },
    {
      id: "recycling-growth",
      label: "Recycling Growth",
      unit: "%",
      description: "Recyclable and eco-forward listings converted into measurable circular recovery momentum.",
      colorClass: "recycling-growth",
      chartStyle: "wave",
      currentValue: `${Math.round(recyclingRate)}%`,
      change: calculateChange(recyclingHistory),
      direction: calculateDirection(recyclingHistory),
      history: buckets.map((bucket, index) => ({
        label: bucket.label,
        dateKey: bucket.dateKey,
        value: Number(Math.min(100, recyclingHistory[index] ?? 0).toFixed(1))
      })),
      summary: `${recyclingAlignedListings || collectedCount} recycling-aligned activity signals tracked`
    },
    {
      id: "carbon-reduction",
      label: "Carbon Reduction",
      unit: " t",
      description: "Reuse-first activity lowers replacement demand and avoids emissions from unnecessary disposal.",
      colorClass: "carbon-reduction",
      chartStyle: "plateau",
      currentValue: `${formatCompactValue(totals.carbonReduction)} t`,
      change: calculateChange(carbonHistory),
      direction: calculateDirection(carbonHistory),
      history: buckets.map((bucket, index) => ({
        label: bucket.label,
        dateKey: bucket.dateKey,
        value: carbonHistory[index] ?? 0
      })),
      summary: `${resources.filter((resource) => completedStatuses.has(resource.availabilityStatus)).length} successful reuse handoffs tracked`
    },
    {
      id: "resource-recovery",
      label: "Resource Recovery",
      unit: " pts",
      description: "Successful redistribution, claims, and completed matches showing useful resources recovered by the community.",
      colorClass: "resource-recovery",
      chartStyle: "surge",
      currentValue: `${formatCompactValue(totals.resourceRecovery)} pts`,
      change: calculateChange(recoveryHistory),
      direction: calculateDirection(recoveryHistory),
      history: buckets.map((bucket, index) => ({
        label: bucket.label,
        dateKey: bucket.dateKey,
        value: recoveryHistory[index] ?? 0
      })),
      summary: `${resources.filter((resource) => completedStatuses.has(resource.availabilityStatus)).length + storyCount} recoveries and stories reinforce outcomes`
    }
  ];
}

function createTrendBuckets(resources: ResourceListing[], stories: ImpactStory[]): TrendBucket[] {
  const timestamps = [
    ...resources
    .map((resource) => new Date(resource.postedAt).getTime())
    .filter((timestamp) => Number.isFinite(timestamp)),
    ...stories
      .map((story) => new Date(story.createdAt).getTime())
      .filter((timestamp) => Number.isFinite(timestamp))
  ]
    .sort((left, right) => left - right);

  const latestTimestamp = timestamps[timestamps.length - 1] ?? Date.now();
  const start = new Date(latestTimestamp);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 7);

  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      dateKey: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    };
  });
}

function getBucketIndex(postedAt: string, buckets: TrendBucket[]) {
  const dateKey = new Date(postedAt).toISOString().slice(0, 10);
  return buckets.findIndex((bucket) => bucket.dateKey === dateKey);
}

function estimateResourceWeight(resource: ResourceListing) {
  const quantityValue = parseFirstNumber(resource.quantity);
  const baseWeight = categoryWeightMap[resource.category] ?? 8;
  return Number((baseWeight * 0.18 + quantityValue * Math.max(0.16, baseWeight / 85)).toFixed(1));
}

function parseFirstNumber(input: string) {
  const matches = input.match(/\d+(\.\d+)?/g);
  if (!matches?.length) return 1;
  return matches.reduce((sum, value) => sum + Number(value), 0);
}

function calculateChange(values: number[]) {
  if (values.length < 2) return 0;
  const previous = values[values.length - 2] ?? 0;
  const current = values[values.length - 1] ?? 0;
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function calculateDirection(values: number[]) {
  return (values[values.length - 1] ?? 0) >= (values[values.length - 2] ?? 0) ? "up" : "down";
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatCompactValue(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 100) return Math.round(value).toString();
  return value.toFixed(1).replace(/\.0$/, "");
}

function createChartPath(
  coordinates: Array<{ x: number; y: number }>,
  chartStyle: ImpactMetric["chartStyle"]
) {
  if (!coordinates.length) return "";
  if (chartStyle === "plateau") return createPlateauPath(coordinates);
  if (chartStyle === "crest") return createCrestPath(coordinates);
  if (chartStyle === "wave") return createWavePath(coordinates);
  return createSurgePath(coordinates);
}

function createCrestPath(coordinates: Array<{ x: number; y: number }>) {
  return createSmoothPath(warpCoordinates(coordinates, [0.08, -0.34, -0.55, 0.18, 0.24, 0.1, -0.12, -0.4]));
}

function createWavePath(coordinates: Array<{ x: number; y: number }>) {
  return createSmoothPath(warpCoordinates(coordinates, [-0.04, 0.14, 0.22, -0.14, 0.28, 0.62, -0.18, -0.24]));
}

function createPlateauPath(coordinates: Array<{ x: number; y: number }>) {
  const warped = warpCoordinates(coordinates, [-0.12, -0.45, 0.66, 0.18, 0.16, 0.18, -0.08, -0.32]);
  return warped
    .map(({ x, y }, index) => {
      if (index === 0) return `M ${x} ${y}`;
      const previous = warped[index - 1];
      const elbowX = previous.x + (x - previous.x) * 0.18;
      return `L ${elbowX} ${previous.y} L ${elbowX} ${y} L ${x} ${y}`;
    })
    .join(" ");
}

function createSurgePath(coordinates: Array<{ x: number; y: number }>) {
  return createSmoothPath(warpCoordinates(coordinates, [-0.08, 0.22, 0.08, 0.02, 0.38, -0.72, -0.42, -0.34]));
}

function createSmoothPath(coordinates: Array<{ x: number; y: number }>) {
  if (coordinates.length < 2) return `M ${coordinates[0]?.x ?? 0} ${coordinates[0]?.y ?? 0}`;
  let path = `M ${coordinates[0].x} ${coordinates[0].y}`;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const current = coordinates[index];
    const next = coordinates[index + 1];
    const previous = coordinates[index - 1] ?? current;
    const afterNext = coordinates[index + 2] ?? next;

    const controlPointOneX = current.x + (next.x - previous.x) / 6;
    const controlPointOneY = current.y + (next.y - previous.y) / 6;
    const controlPointTwoX = next.x - (afterNext.x - current.x) / 6;
    const controlPointTwoY = next.y - (afterNext.y - current.y) / 6;

    path += ` C ${controlPointOneX} ${controlPointOneY}, ${controlPointTwoX} ${controlPointTwoY}, ${next.x} ${next.y}`;
  }

  return path;
}

function warpCoordinates(
  coordinates: Array<{ x: number; y: number }>,
  profile: number[]
) {
  const minY = Math.min(...coordinates.map((point) => point.y));
  const maxY = Math.max(...coordinates.map((point) => point.y));
  const amplitude = Math.max((maxY - minY) * 0.22, 8);

  return coordinates.map((point, index) => ({
    ...point,
    y: point.y + (profile[index] ?? 0) * amplitude
  }));
}

function shapeMetricHistory(
  values: number[],
  chartStyle: ImpactMetric["chartStyle"],
  scale: number
) {
  const profileMap: Record<ImpactMetric["chartStyle"], number[]> = {
    crest: [0.18, 0.62, 0.88, 0.38, 0.24, 0.18, 0.48, 0.96],
    wave: [0.52, 0.44, 0.32, 0.6, 0.22, -0.4, 0.36, 0.42],
    plateau: [0.18, 0.96, -0.74, -0.14, -0.12, -0.08, 0.38, 0.8],
    surge: [0.1, -0.28, -0.02, 0.06, -0.42, 1.08, 0.92, 0.88]
  };
  const tuningMap: Record<ImpactMetric["chartStyle"], { carry: number; gain: number; momentum: number; floor: number }> = {
    crest: { carry: 0.58, gain: 1.18, momentum: 0.64, floor: 1.2 },
    wave: { carry: 0.54, gain: 1.06, momentum: 0.82, floor: 0.8 },
    plateau: { carry: 0.5, gain: 1.12, momentum: 0.72, floor: 0.9 },
    surge: { carry: 0.46, gain: 1.24, momentum: 0.96, floor: 0.9 }
  };

  const profile = profileMap[chartStyle];
  const tuning = tuningMap[chartStyle];
  const average = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const denominator = Math.max(average, 0.9);
  let previous = Math.max(tuning.floor, values[0] * tuning.gain + profile[0] * scale);

  return values.map((value, index) => {
    if (index === 0) {
      return Number(previous.toFixed(1));
    }

    const normalized = value / denominator;
    const previousRaw = values[index - 1] / denominator;
    const momentum = normalized - previousRaw;
    const next = Math.max(
      tuning.floor,
      previous * tuning.carry +
        normalized * scale * tuning.gain +
        momentum * scale * tuning.momentum +
        profile[index] * scale
    );

    previous = next;
    return Number(next.toFixed(1));
  });
}
